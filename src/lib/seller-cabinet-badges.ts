import { prisma } from "@/lib/prisma";

export async function getSellerCabinetBadges(userId: string) {
  const [unreadMessages, listingCount, followerCount, pendingPriceOffers] = await Promise.all([
    prisma.message.count({
      where: { receiverId: userId, read: false },
    }),
    prisma.listing.count({
      where: { sellerId: userId, status: { in: ["ACTIVE", "PENDING"] } },
    }),
    prisma.sellerFollow.count({ where: { sellerId: userId } }),
    prisma.priceOffer.count({
      where: {
        status: "PENDING",
        sellerRead: false,
        listing: { sellerId: userId },
      },
    }),
  ]);

  return { unreadMessages, listingCount, followerCount, pendingPriceOffers };
}
