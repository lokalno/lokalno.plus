import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  notifyBuyerOrderConfirmed,
  notifyBuyerOrderShipped,
} from "@/lib/order-notifications";
import { ORDER_PAYMENT_NP_COD_RECEIVED } from "@/lib/order-payment";
import { getNovaPoshtaTrackingUrl, validateNovaPoshtaTtn } from "@/lib/order-shipping";
import { validateSellerCancelInput } from "@/lib/order-cancel";
import { cancelOrderInTransaction } from "@/lib/order-cancel-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: { select: { title: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isSeller = order.sellerId === session.user.id;
  const isBuyer = order.buyerId === session.user.id;

  if (!isSeller && !isBuyer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status, action, novaPoshtaTtn, cancelReason, cancelReasonNote } = body;

  if (action === "ship" || status === "SHIPPED") {
    if (!isSeller) {
      return NextResponse.json({ error: "Лише продавець може відправити замовлення" }, { status: 403 });
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Спочатку підтвердіть замовлення, потім відправте його" },
        { status: 400 }
      );
    }

    const ttnResult = validateNovaPoshtaTtn(novaPoshtaTtn);
    if (!ttnResult.ok) {
      return NextResponse.json({ error: ttnResult.error }, { status: 400 });
    }

    const trackingUrl = getNovaPoshtaTrackingUrl(ttnResult.ttn);

    const updated = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.update({
        where: { id },
        data: {
          status: "SHIPPED",
          novaPoshtaTtn: ttnResult.ttn,
          shippedAt: new Date(),
        },
      });

      await notifyBuyerOrderShipped(tx, {
        listingId: order.listingId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        listingTitle: order.listing.title,
        orderNumber: order.orderNumber,
        ttn: ttnResult.ttn,
        trackingUrl,
      });

      return currentOrder;
    });

    return NextResponse.json(updated);
  }

  if (status === "CONFIRMED") {
    if (!isSeller) {
      return NextResponse.json({ error: "Лише продавець може підтвердити замовлення" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Замовлення вже оброблено" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      await notifyBuyerOrderConfirmed(tx, {
        listingId: order.listingId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        listingTitle: order.listing.title,
        orderNumber: order.orderNumber,
      });

      return currentOrder;
    });

    return NextResponse.json(updated);
  }

  if (status === "COMPLETED") {
    if (order.status !== "SHIPPED" || !order.novaPoshtaTtn) {
      return NextResponse.json(
        { error: "Завершити можна лише після відправки Nova Poshta з ТТН" },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "COMPLETED",
        ...(order.paymentStatus !== "PAID" ? { paymentStatus: ORDER_PAYMENT_NP_COD_RECEIVED } : {}),
      },
    });

    return NextResponse.json(updated);
  }

  if (status === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "COMPLETED") {
    if (isSeller) {
      const validation = validateSellerCancelInput({ cancelReason, cancelReasonNote });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        return cancelOrderInTransaction(tx, {
          orderId: id,
          cancelledById: session.user!.id,
          cancelledByRole: isSeller ? "SELLER" : "BUYER",
          cancelReason: isSeller ? cancelReason : null,
          cancelReasonNote: isSeller ? cancelReasonNote : null,
        });
      });

      return NextResponse.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_STATUS") {
        return NextResponse.json({ error: "Це замовлення вже не можна скасувати" }, { status: 400 });
      }
      throw error;
    }
  }

  return NextResponse.json({ error: "Невірна дія" }, { status: 400 });
}
