import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  notifyBuyerOrderConfirmed,
  notifyBuyerOrderShipped,
  notifySellerReturnRequested,
} from "@/lib/order-notifications";
import { ORDER_PAYMENT_NP_COD_RECEIVED } from "@/lib/order-payment";
import { getNovaPoshtaTrackingUrl, validateNovaPoshtaTtn } from "@/lib/order-shipping";
import { markOrderNotReceivedByBuyerInTransaction } from "@/lib/order-not-received-service";
import { validateSellerCancelInput, validateBuyerCancelInput } from "@/lib/order-cancel";
import { cancelOrderInTransaction } from "@/lib/order-cancel-service";
import { canRequestOrderReturn } from "@/lib/order-history";
import { getReturnReasonLabel, validateReturnRequestInput } from "@/lib/order-return";

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
  const { status, action, novaPoshtaTtn, cancelReason, cancelReasonNote, returnReason, returnReasonNote } =
    body;

  if (action === "request_return") {
    if (!isBuyer) {
      return NextResponse.json({ error: "Лише покупець може запросити повернення" }, { status: 403 });
    }

    if (order.returnRequestedAt) {
      return NextResponse.json({ error: "Запит на повернення вже надіслано" }, { status: 400 });
    }

    if (!canRequestOrderReturn(order)) {
      return NextResponse.json(
        {
          error:
            "Запросити повернення можна лише протягом 3 днів після підтвердження отримання. Зверніться до продавця напряму.",
        },
        { status: 400 }
      );
    }

    const validation = validateReturnRequestInput({ returnReason, returnReasonNote });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const reasonLabel = getReturnReasonLabel(validation.reason, validation.note);

    const updated = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.update({
        where: { id },
        data: {
          returnRequestedAt: new Date(),
          returnReason: validation.reason,
          returnReasonNote: validation.note,
        },
      });

      await notifySellerReturnRequested(tx, {
        listingId: order.listingId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        listingTitle: order.listing.title,
        orderNumber: order.orderNumber,
        reasonLabel,
      });

      return currentOrder;
    });

    return NextResponse.json(updated);
  }

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

  if (action === "not_received_by_buyer") {
    if (!isSeller) {
      return NextResponse.json(
        { error: "Лише продавець може позначити, що покупець не забрав посилку" },
        { status: 403 }
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        return markOrderNotReceivedByBuyerInTransaction(tx, {
          orderId: id,
          sellerId: session.user!.id,
        });
      });

      return NextResponse.json(result.order);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
        }
        if (error.message === "FORBIDDEN") {
          return NextResponse.json({ error: "Немає доступу до цього замовлення" }, { status: 403 });
        }
        if (error.message === "INVALID_STATUS") {
          return NextResponse.json(
            {
              error:
                "Позначити «не забрано» можна лише для відправленого замовлення з ТТН Nova Poshta",
            },
            { status: 400 }
          );
        }
      }
      throw error;
    }
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
        completedAt: new Date(),
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
    } else if (isBuyer) {
      const validation = validateBuyerCancelInput({ cancelReason, cancelReasonNote });
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
          cancelReason: cancelReason ?? null,
          cancelReasonNote: cancelReasonNote ?? null,
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
