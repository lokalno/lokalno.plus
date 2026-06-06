import type { PrismaClient } from "@prisma/client";

const INACTIVE_ORDER_STATUSES = ["CANCELLED", "COMPLETED"] as const;

export async function deleteListingById(
  prisma: PrismaClient,
  listingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });

  if (!listing) {
    return { ok: false, error: "Оголошення не знайдено" };
  }

  const activeOrders = await prisma.order.count({
    where: {
      listingId,
      status: { notIn: [...INACTIVE_ORDER_STATUSES] },
    },
  });

  if (activeOrders > 0) {
    return {
      ok: false,
      error:
        "Неможливо видалити: є активні замовлення. Спочатку завершіть або скасуйте їх у розділі «Замовлення».",
    };
  }

  const orders = await prisma.order.findMany({
    where: { listingId },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { listingId } });
    await tx.priceOffer.deleteMany({ where: { listingId } });

    if (orderIds.length > 0) {
      await tx.walletTransaction.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { listingId } });
    }

    await tx.message.deleteMany({ where: { listingId } });
    await tx.report.deleteMany({ where: { listingId } });
    await tx.favorite.deleteMany({ where: { listingId } });
    await tx.listing.delete({ where: { id: listingId } });
  });

  return { ok: true };
}
