import { prisma } from "@/lib/prisma";

export type NotificationCounts = {
  unreadMessages: number;
  unreadPriceOffers: number;
  total: number;
};

export async function getNotificationCounts(userId: string): Promise<NotificationCounts> {
  const [unreadMessages, unreadPriceOffersAsSeller, unreadPriceOffersAsBuyer] = await Promise.all([
    prisma.message.count({
      where: { receiverId: userId, read: false },
    }),
    prisma.priceOffer.count({
      where: {
        status: "PENDING",
        sellerRead: false,
        listing: { sellerId: userId },
      },
    }),
    prisma.priceOffer.count({
      where: {
        buyerId: userId,
        buyerStatusRead: false,
        status: { in: ["ACCEPTED", "REJECTED"] },
      },
    }),
  ]);

  const unreadPriceOffers = unreadPriceOffersAsSeller + unreadPriceOffersAsBuyer;

  return {
    unreadMessages,
    unreadPriceOffers,
    total: unreadMessages + unreadPriceOffers,
  };
}

export async function markSellerPriceOffersRead(userId: string) {
  await prisma.priceOffer.updateMany({
    where: {
      status: "PENDING",
      sellerRead: false,
      listing: { sellerId: userId },
    },
    data: { sellerRead: true },
  });
}

export async function markBuyerPriceOfferStatusRead(userId: string, listingId?: string) {
  await prisma.priceOffer.updateMany({
    where: {
      buyerId: userId,
      buyerStatusRead: false,
      status: { in: ["ACCEPTED", "REJECTED"] },
      ...(listingId ? { listingId } : {}),
    },
    data: { buyerStatusRead: true },
  });
}
