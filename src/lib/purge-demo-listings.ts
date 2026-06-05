import type { PrismaClient } from "@prisma/client";

/** Demo sellers from seed — not real users. Admin account is excluded. */
export const DEMO_SELLER_EMAILS = [
  "demo@lokalno.ua",
  "seller1@lokalno.ua",
  "seller2@lokalno.ua",
  "seller3@lokalno.ua",
  "seller4@lokalno.ua",
] as const;

export type PurgeDemoListingsResult = {
  sellers: number;
  listings: number;
  orders: number;
  messages: number;
  reviews: number;
  priceOffers: number;
};

export async function purgeDemoListings(prisma: PrismaClient): Promise<PurgeDemoListingsResult> {
  const sellers = await prisma.user.findMany({
    where: { email: { in: [...DEMO_SELLER_EMAILS] } },
    select: { id: true, email: true },
  });

  if (sellers.length === 0) {
    return { sellers: 0, listings: 0, orders: 0, messages: 0, reviews: 0, priceOffers: 0 };
  }

  const sellerIds = sellers.map((s) => s.id);
  const listings = await prisma.listing.findMany({
    where: { sellerId: { in: sellerIds } },
    select: { id: true },
  });

  if (listings.length === 0) {
    return {
      sellers: sellers.length,
      listings: 0,
      orders: 0,
      messages: 0,
      reviews: 0,
      priceOffers: 0,
    };
  }

  const listingIds = listings.map((l) => l.id);

  const orders = await prisma.order.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  return prisma.$transaction(async (tx) => {
    const reviews = await tx.review.deleteMany({ where: { listingId: { in: listingIds } } });
    const priceOffers = await tx.priceOffer.deleteMany({ where: { listingId: { in: listingIds } } });

    if (orderIds.length > 0) {
      await tx.walletTransaction.deleteMany({ where: { orderId: { in: orderIds } } });
    }

    const deletedOrders = await tx.order.deleteMany({ where: { listingId: { in: listingIds } } });
    const messages = await tx.message.deleteMany({ where: { listingId: { in: listingIds } } });
    await tx.report.deleteMany({ where: { listingId: { in: listingIds } } });
    await tx.favorite.deleteMany({ where: { listingId: { in: listingIds } } });
    const deletedListings = await tx.listing.deleteMany({ where: { id: { in: listingIds } } });

    return {
      sellers: sellers.length,
      listings: deletedListings.count,
      orders: deletedOrders.count,
      messages: messages.count,
      reviews: reviews.count,
      priceOffers: priceOffers.count,
    };
  });
}
