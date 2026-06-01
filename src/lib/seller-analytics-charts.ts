import type { OrderListItem } from "@/components/OrdersList";
import type { SellerStatsPeriod } from "@/lib/seller-order-analytics";
import { getSellerStatsPeriodStart } from "@/lib/seller-order-analytics";
import { getOrderTotalAmount, getOrderQuantity } from "@/lib/order-total";

export type AnalyticsChartPoint = {
  label: string;
  orders: number;
  income: number;
};

function getOrderDate(order: OrderListItem) {
  return typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" }).format(date);
}

function formatHourLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", { month: "short" }).format(date);
}

function initPoint(label: string): AnalyticsChartPoint {
  return { label, orders: 0, income: 0 };
}

function addOrderToPoint(point: AnalyticsChartPoint, order: OrderListItem) {
  if (order.status === "CANCELLED") return;
  point.orders += 1;
  if (order.paymentStatus === "PAID") {
    point.income += getOrderTotalAmount(order.listing.price, getOrderQuantity(order));
  }
}

export function buildSellerAnalyticsSeries(
  orders: OrderListItem[],
  period: SellerStatsPeriod,
  now = new Date()
): AnalyticsChartPoint[] {
  const periodStart = getSellerStatsPeriodStart(period, now);
  const inPeriod = orders.filter((order) => getOrderDate(order) >= periodStart);

  if (period === "day") {
    const points = Array.from({ length: 24 }, (_, hour) => {
      const date = new Date(periodStart);
      date.setHours(hour, 0, 0, 0);
      return initPoint(formatHourLabel(date));
    });

    for (const order of inPeriod) {
      const date = getOrderDate(order);
      const hour = date.getHours();
      addOrderToPoint(points[hour], order);
    }

    return points.filter((_, index) => index % 3 === 0 || index === 23);
  }

  if (period === "week") {
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(periodStart);
      date.setDate(date.getDate() + index);
      return initPoint(formatDayLabel(date));
    });

    for (const order of inPeriod) {
      const date = getOrderDate(order);
      const dayIndex = Math.floor(
        (date.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        addOrderToPoint(points[dayIndex], order);
      }
    }

    return points;
  }

  if (period === "month") {
    const points = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(periodStart);
      date.setDate(date.getDate() + index);
      return initPoint(formatDayLabel(date));
    });

    for (const order of inPeriod) {
      const date = getOrderDate(order);
      const dayIndex = Math.floor(
        (date.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < 30) {
        addOrderToPoint(points[dayIndex], order);
      }
    }

    return points.filter((_, index) => index % 5 === 0 || index === 29);
  }

  const points = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return { ...initPoint(formatMonthLabel(date)), monthKey: date.getFullYear() * 12 + date.getMonth() };
  });

  for (const order of inPeriod) {
    const date = getOrderDate(order);
    const monthKey = date.getFullYear() * 12 + date.getMonth();
    const point = points.find((item) => item.monthKey === monthKey);
    if (point) addOrderToPoint(point, order);
  }

  return points.map(({ label, orders, income }) => ({ label, orders, income }));
}

export function getAnalyticsTotals(points: AnalyticsChartPoint[]) {
  return points.reduce(
    (acc, point) => ({
      orders: acc.orders + point.orders,
      income: acc.income + point.income,
    }),
    { orders: 0, income: 0 }
  );
}
