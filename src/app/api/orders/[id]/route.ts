import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reversePaidOrder } from "@/lib/wallet-credit";
import {
  notifyBuyerOrderCancelledBySeller,
  notifyBuyerOrderConfirmed,
  notifyBuyerOrderShipped,
} from "@/lib/order-notifications";
import { ORDER_PAYMENT_NP_COD_RECEIVED } from "@/lib/order-payment";
import { getNovaPoshtaTrackingUrl, validateNovaPoshtaTtn } from "@/lib/order-shipping";

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
  const { status, action, novaPoshtaTtn } = body;

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
    if (order.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Завершити можна лише після відправки Nova Poshta" },
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
    const updated = await prisma.$transaction(async (tx) => {
      await reversePaidOrder(tx, id);

      const currentOrder = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledById: session.user!.id,
        },
      });

      const listing = await tx.listing.findUnique({ where: { id: order.listingId } });
      if (listing) {
        const restoreQty = order.quantity > 0 ? order.quantity : 1;
        const newStock = listing.stock + restoreQty;
        await tx.listing.update({
          where: { id: order.listingId },
          data: {
            stock: newStock,
            ...(listing.status === "SOLD" ? { status: "ACTIVE" } : {}),
          },
        });
      }

      if (isSeller) {
        await notifyBuyerOrderCancelledBySeller(tx, {
          listingId: order.listingId,
          sellerId: order.sellerId,
          buyerId: order.buyerId,
          listingTitle: order.listing.title,
          orderNumber: order.orderNumber,
        });
      }

      if (order.priceOfferId) {
        await tx.priceOffer.update({
          where: { id: order.priceOfferId },
          data: {
            orderId: null,
            status: "CLOSED",
          },
        });
      }

      return currentOrder;
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Невірна дія" }, { status: 400 });
}
