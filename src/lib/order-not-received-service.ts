import type { Prisma } from "@prisma/client";
import { reversePaidOrder } from "@/lib/wallet-credit";
import {
  applyBuyerNotReceivedPenalty,
  NOT_RECEIVED_BY_BUYER_STATUS,
} from "@/lib/buyer-purchase-protection";
import {
  incrementVariantStock,
  parseListingVariants,
  serializeListingVariants,
  sumVariantStock,
} from "@/lib/listing-variants";

async function restoreListingStockForOrder(
  tx: Prisma.TransactionClient,
  order: {
    listingId: string;
    quantity: number;
    variantColor: string | null;
    variantSize: string | null;
  }
) {
  const listing = await tx.listing.findUnique({ where: { id: order.listingId } });
  if (!listing) return;

  const restoreQty = order.quantity > 0 ? order.quantity : 1;

  if (order.variantColor && order.variantSize && listing.variants) {
    const parsedVariants = parseListingVariants(listing.variants);
    const restoredVariants = incrementVariantStock(
      parsedVariants,
      order.variantColor,
      order.variantSize,
      restoreQty
    );
    if (restoredVariants) {
      await tx.listing.update({
        where: { id: order.listingId },
        data: {
          variants: serializeListingVariants(restoredVariants),
          stock: sumVariantStock(restoredVariants),
          ...(listing.status === "SOLD" ? { status: "ACTIVE" } : {}),
        },
      });
    }
    return;
  }

  await tx.listing.update({
    where: { id: order.listingId },
    data: {
      stock: listing.stock + restoreQty,
      ...(listing.status === "SOLD" ? { status: "ACTIVE" } : {}),
    },
  });
}

export async function markOrderNotReceivedByBuyerInTransaction(
  tx: Prisma.TransactionClient,
  params: { orderId: string; sellerId: string }
) {
  const order = await tx.order.findUnique({
    where: { id: params.orderId },
  });

  if (!order) {
    throw new Error("NOT_FOUND");
  }

  if (order.sellerId !== params.sellerId) {
    throw new Error("FORBIDDEN");
  }

  if (order.status !== "SHIPPED" || !order.novaPoshtaTtn?.trim()) {
    throw new Error("INVALID_STATUS");
  }

  await reversePaidOrder(tx, params.orderId);

  const updatedOrder = await tx.order.update({
    where: { id: params.orderId },
    data: {
      status: NOT_RECEIVED_BY_BUYER_STATUS,
      notReceivedAt: new Date(),
    },
  });

  await restoreListingStockForOrder(tx, order);

  if (order.priceOfferId) {
    await tx.priceOffer.update({
      where: { id: order.priceOfferId },
      data: {
        orderId: null,
        status: "CLOSED",
      },
    });
  }

  const penalty = await applyBuyerNotReceivedPenalty(tx, order.buyerId);

  return { order: updatedOrder, penalty };
}
