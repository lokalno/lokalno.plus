import { prisma } from "@/lib/prisma";
import { getSellerOrderCounts } from "@/lib/seller-orders";
import { getSellerCabinetBadges } from "@/lib/seller-cabinet-badges";

export async function getSellerAnalyticsPageData(userId: string) {
  const [user, orders, badges, viewsAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        avatar: true,
        reviewsReceived: { select: { rating: true } },
      },
    }),
    prisma.order.findMany({
      where: { sellerId: userId },
      include: {
        listing: true,
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getSellerCabinetBadges(userId),
    prisma.listing.aggregate({
      where: { sellerId: userId },
      _sum: { views: true },
    }),
  ]);

  if (!user) return null;

  const reviewCount = user.reviewsReceived.length;
  const avgRating =
    reviewCount > 0
      ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : null;

  const serializedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));

  const orderCounts = getSellerOrderCounts(serializedOrders);

  return {
    user,
    orders: serializedOrders,
    unreadMessages: badges.unreadMessages,
    reviewCount,
    avgRating,
    orderCounts,
    listingCount: badges.listingCount,
    followerCount: badges.followerCount,
    pendingPriceOffers: badges.pendingPriceOffers,
    totalViews: viewsAgg._sum.views ?? 0,
  };
}
