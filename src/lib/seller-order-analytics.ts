import type { OrderListItem } from "@/components/OrdersList";
import { getSellerOrderBucket } from "@/lib/seller-orders";
import { getOrderTotalAmount, getOrderQuantity } from "@/lib/order-total";
import { isSuccessfulSale } from "@/lib/order-cancel";
import { ORDER_PAYMENT_NP_COD_RECEIVED } from "@/lib/order-payment";
export type SellerStatsPeriod = "day" | "week" | "month" | "year";

export const SELLER_STATS_PERIOD_LABELS: Record<SellerStatsPeriod, string> = {
  day: "1 день",
  week: "7 днів",
  month: "Місяць",
  year: "Рік",
};

export function getSellerStatsPeriodStart(period: SellerStatsPeriod, now = new Date()): Date {
  const start = new Date(now);

  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0);
      return start;
    case "week":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return start;
    case "month":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return start;
    case "year":
      start.setDate(start.getDate() - 364);
      start.setHours(0, 0, 0, 0);
      return start;
  }
}

export type SellerPeriodStats = {
  totalOrders: number;
  newOrders: number;
  completedOrders: number;
  income: number;
};

function getOrderDate(order: OrderListItem) {
  return typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt;
}

export function getSellerPeriodStats(
  orders: OrderListItem[],
  period: SellerStatsPeriod,
  now = new Date()
): SellerPeriodStats {
  const periodStart = getSellerStatsPeriodStart(period, now);
  const inPeriod = orders.filter((order) => getOrderDate(order) >= periodStart);

  const active = inPeriod.filter((order) => order.status !== "CANCELLED");
  const newOrders = active.filter((order) => getSellerOrderBucket(order) === "new").length;
  const completedOrders = inPeriod.filter((order) => isSuccessfulSale(order)).length;
  const income = inPeriod
    .filter(
      (order) =>
        isSuccessfulSale(order) &&
        (order.paymentStatus === "PAID" || order.paymentStatus === ORDER_PAYMENT_NP_COD_RECEIVED)
    )    .reduce((sum, order) => sum + getOrderTotalAmount(order.listing.price, getOrderQuantity(order)), 0);

  return {
    totalOrders: active.length,
    newOrders,
    completedOrders,
    income,
  };
}
