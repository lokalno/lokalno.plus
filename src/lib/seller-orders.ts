import type { OrderListItem } from "@/components/OrdersList";
import { isOrderShipped, isSuccessfulSale } from "@/lib/order-cancel";

export type SellerOrderFilter = "all" | "new" | "processing" | "sent" | "completed" | "cancelled";

export type SellerOrderBucket = SellerOrderFilter | "cancelled";

export function getSellerOrderBucket(
  order: Pick<OrderListItem, "status" | "paymentStatus" | "novaPoshtaTtn">
): SellerOrderBucket {
  if (order.status === "CANCELLED" || order.status === "NOT_RECEIVED_BY_BUYER") return "cancelled";
  if (order.status === "PENDING") return "new";
  if (isSuccessfulSale(order)) return "completed";
  if (isOrderShipped(order)) return "sent";
  if (order.status === "CONFIRMED" || order.status === "SHIPPED") return "processing";
  return "processing";
}

export const SELLER_ORDER_FILTER_LABELS: Record<SellerOrderFilter, string> = {
  all: "Всі замовлення",
  new: "Нові",
  processing: "В обробці",
  sent: "Відправлені",
  completed: "Завершені",
  cancelled: "Скасовані",
};

export const SELLER_ORDER_STATUS_LABELS: Record<SellerOrderBucket, string> = {
  all: "Усі",
  new: "Новий",
  processing: "В обробці",
  sent: "Відправлений",
  completed: "Завершений",
  cancelled: "Скасовано",
};

export const SELLER_ORDER_STATUS_STYLES: Record<
  SellerOrderBucket,
  { badge: string; dot: string }
> = {
  all: { badge: "bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  new: { badge: "bg-orange-50 text-orange-700 border border-orange-100", dot: "bg-orange-500" },
  processing: { badge: "bg-blue-50 text-blue-700 border border-blue-100", dot: "bg-blue-500" },
  sent: { badge: "bg-violet-50 text-violet-700 border border-violet-100", dot: "bg-violet-500" },
  completed: { badge: "bg-emerald-50 text-emerald-700 border border-emerald-100", dot: "bg-emerald-500" },
  cancelled: { badge: "bg-red-50 text-red-700 border border-red-100", dot: "bg-red-500" },
};

export function getSellerOrderCounts(
  orders: Pick<OrderListItem, "status" | "paymentStatus">[]
) {
  const active = orders.filter(
    (order) => order.status !== "CANCELLED" && order.status !== "NOT_RECEIVED_BY_BUYER"
  );

  return {
    total: active.length,
    new: active.filter((order) => getSellerOrderBucket(order) === "new").length,
    processing: active.filter((order) => getSellerOrderBucket(order) === "processing").length,
    sent: active.filter((order) => getSellerOrderBucket(order) === "sent").length,
    completed: active.filter((order) => getSellerOrderBucket(order) === "completed").length,
    cancelled: orders.filter(
      (order) => order.status === "CANCELLED" || order.status === "NOT_RECEIVED_BY_BUYER"
    ).length,
  };
}

export function filterSellerOrders(orders: OrderListItem[], filter: SellerOrderFilter) {
  if (filter === "cancelled") {
    return orders.filter(
      (order) => order.status === "CANCELLED" || order.status === "NOT_RECEIVED_BY_BUYER"
    );
  }

  if (filter === "all") {
    return orders.filter(
      (order) => order.status !== "CANCELLED" && order.status !== "NOT_RECEIVED_BY_BUYER"
    );
  }

  return orders.filter((order) => getSellerOrderBucket(order) === filter);
}

export {
  formatOrderNumber,
  formatSellerOrderNumber,
  ORDER_NUMBER_START,
} from "@/lib/order-number";
export type { OrderNumberSource } from "@/lib/order-number";

export function formatSellerOrderDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatBuyerPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return phone;
}
