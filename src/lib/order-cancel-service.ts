import type { Prisma, PrismaClient } from "@prisma/client";
import { reversePaidOrder } from "@/lib/wallet-credit";
import { AUTO_CANCEL_REASON, type OrderCancelRole } from "@/lib/order-cancel";
import {
  notifyBuyerOrderAutoCancelled,
  notifyBuyerOrderCancelledBySeller,
  notifySellerOrderAutoCancelled,
} from "@/lib/order-notifications";

type CancelOrderParams = {
  orderId: string;
  cancelledById: string | null;
  cancelledByRole: OrderCancelRole;
  cancelReason?: string | null;
  cancelReasonNote?: string | null;
  notifyBuyerOnSellerCancel?: boolean;
  notifyOnAutoCancel?: boolean;
};

export async function cancelOrderInTransaction(
  tx: Prisma.TransactionClient,
  params: CancelOrderParams
) {
  const order = await tx.order.findUnique({
    where: { id: params.orderId },
    include: { listing: { select: { title: true } } },
  });

  if (!order) {
    throw new Error("NOT_FOUND");
  }

  if (order.status === "CANCELLED" || order.status === "COMPLETED" || order.status === "SHIPPED") {
    throw new Error("INVALID_STATUS");
  }

  await reversePaidOrder(tx, params.orderId);

  const currentOrder = await tx.order.update({
    where: { id: params.orderId },
    data: {
      status: "CANCELLED",
      cancelledById: params.cancelledById,
      cancelledByRole: params.cancelledByRole,
      cancelReason: params.cancelReason ?? null,
      cancelReasonNote: params.cancelReasonNote?.trim() || null,
      cancelledAt: new Date(),
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

  if (params.cancelledByRole === "SELLER" && params.notifyBuyerOnSellerCancel !== false) {
    await notifyBuyerOrderCancelledBySeller(tx, {
      listingId: order.listingId,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      listingTitle: order.listing.title,
      orderNumber: order.orderNumber,
      cancelReason: params.cancelReason,
      cancelReasonNote: params.cancelReasonNote,
    });
  }

  if (params.cancelledByRole === "SYSTEM" && params.notifyOnAutoCancel !== false) {
    await Promise.all([
      notifyBuyerOrderAutoCancelled(tx, {
        listingId: order.listingId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        listingTitle: order.listing.title,
        orderNumber: order.orderNumber,
      }),
      notifySellerOrderAutoCancelled(tx, {
        listingId: order.listingId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        listingTitle: order.listing.title,
        orderNumber: order.orderNumber,
      }),
    ]);
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
}

export async function autoCancelStaleOrders(prisma: PrismaClient) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      novaPoshtaTtn: null,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  let cancelled = 0;
  for (const stale of staleOrders) {
    await prisma.$transaction(async (tx) => {
      await cancelOrderInTransaction(tx, {
        orderId: stale.id,
        cancelledById: null,
        cancelledByRole: "SYSTEM",
        cancelReason: AUTO_CANCEL_REASON,
      });
    });
    cancelled += 1;
  }

  return cancelled;
}
