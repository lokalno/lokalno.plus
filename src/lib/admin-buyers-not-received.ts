import { prisma } from "@/lib/prisma";
import { getBuyerOrderStats } from "@/lib/buyer-purchase-protection";

export type AdminBuyerNotReceivedRow = {
  id: string;
  name: string;
  email: string;
  city: string;
  listingCount: number;
  buyerNotReceivedCount: number;
  buyerPurchasesBlocked: boolean;
  buyerPurchasesBlockedUntil: Date | null;
  buyerPurchasesBlockedReason: string | null;
  stats: {
    total: number;
    completed: number;
    notReceived: number;
    cancelled: number;
  };
  purchasesBlockedNow: boolean;
};

export async function getAdminBuyersNotReceivedRows(): Promise<AdminBuyerNotReceivedRow[]> {
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { buyerNotReceivedCount: { gt: 0 } },
        { buyerPurchasesBlocked: true },
        { buyerPurchasesBlockedUntil: { gt: now } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      buyerNotReceivedCount: true,
      buyerPurchasesBlocked: true,
      buyerPurchasesBlockedUntil: true,
      buyerPurchasesBlockedReason: true,
      _count: { select: { listings: true } },
    },
    orderBy: [{ buyerNotReceivedCount: "desc" }, { name: "asc" }],
  });

  const rows = await Promise.all(
    users.map(async (user) => {
      const { _count, ...rest } = user;
      const stats = await getBuyerOrderStats(rest.id);
      const purchasesBlockedNow =
        rest.buyerPurchasesBlocked ||
        Boolean(rest.buyerPurchasesBlockedUntil && rest.buyerPurchasesBlockedUntil > now);

      return {
        ...rest,
        listingCount: _count.listings,
        stats,
        purchasesBlockedNow,
      };
    })
  );

  return rows;
}
