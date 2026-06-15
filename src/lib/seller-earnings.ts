import { prisma } from "@/lib/prisma";
import { isSuccessfulSale } from "@/lib/order-cancel";
import { ORDER_PAYMENT_NP_COD_RECEIVED, formatOrderPaymentStatus } from "@/lib/order-payment";
import { getOrderTotalFromRecord } from "@/lib/order-total";

const PAID_STATUSES = ["PAID", ORDER_PAYMENT_NP_COD_RECEIVED] as const;

function isPaidSale(paymentStatus: string) {
  return (PAID_STATUSES as readonly string[]).includes(paymentStatus);
}

function saleDate(order: { paidAt: Date | null; createdAt: Date }) {
  return order.paidAt ?? order.createdAt;
}

export type SellerEarningsSale = {
  id: string;
  orderNumber: number;
  listingTitle: string;
  amount: number;
  paymentLabel: string;
  date: Date;
};

export type SellerEarningsStats = {
  totalEarned: number;
  completedSalesCount: number;
  monthEarned: number;
  monthSalesCount: number;
  pendingAmount: number;
  pendingCount: number;
  recentSales: SellerEarningsSale[];
  legacyBalance: number;
};

export async function getSellerEarningsStats(userId: string): Promise<SellerEarningsStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [orders, user] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: userId },
      include: {
        listing: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    }),
  ]);

  let totalEarned = 0;
  let completedSalesCount = 0;
  let monthEarned = 0;
  let monthSalesCount = 0;
  let pendingAmount = 0;
  let pendingCount = 0;
  const recentSales: SellerEarningsSale[] = [];

  for (const order of orders) {
    const amount = getOrderTotalFromRecord(order);

    if (isSuccessfulSale(order) && isPaidSale(order.paymentStatus)) {
      totalEarned += amount;
      completedSalesCount += 1;

      const date = saleDate(order);
      if (date >= monthStart) {
        monthEarned += amount;
        monthSalesCount += 1;
      }

      if (recentSales.length < 30) {
        recentSales.push({
          id: order.id,
          orderNumber: order.orderNumber,
          listingTitle: order.listing.title,
          amount,
          paymentLabel: formatOrderPaymentStatus(order.paymentStatus),
          date,
        });
      }
      continue;
    }

    if (
      order.status !== "CANCELLED" &&
      !isSuccessfulSale(order) &&
      (order.status === "SHIPPED" || order.status === "CONFIRMED" || order.status === "PENDING")
    ) {
      pendingAmount += amount;
      pendingCount += 1;
    }
  }

  return {
    totalEarned,
    completedSalesCount,
    monthEarned,
    monthSalesCount,
    pendingAmount,
    pendingCount,
    recentSales,
    legacyBalance: user?.balance ?? 0,
  };
}
