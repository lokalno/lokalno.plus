export const ORDER_TTN_DEADLINE_DAYS = 3;

export const SELLER_CANCEL_REASONS = [
  "ALREADY_SOLD",
  "OUT_OF_STOCK",
  "WRONG_PRICE",
  "CANNOT_CONTACT_BUYER",
  "BUYER_ASKED_CANCEL",
  "LISTING_ERROR",
  "CANNOT_SHIP",
  "OTHER",
] as const;

export type SellerCancelReason = (typeof SELLER_CANCEL_REASONS)[number];

export const SELLER_CANCEL_REASON_LABELS: Record<SellerCancelReason, string> = {
  ALREADY_SOLD: "Товар вже продано",
  OUT_OF_STOCK: "Товар відсутній у наявності",
  WRONG_PRICE: "Вказана неправильна ціна",
  CANNOT_CONTACT_BUYER: "Неможливо зв'язатися з покупцем",
  BUYER_ASKED_CANCEL: "Покупець попросив скасувати замовлення",
  LISTING_ERROR: "Помилка в оголошенні",
  CANNOT_SHIP: "Не можу відправити товар",
  OTHER: "Інша причина",
};

export const BUYER_CANCEL_REASONS = [
  "CHANGED_MIND",
  "FOUND_CHEAPER",
  "WRONG_ORDER",
  "SELLER_TOO_SLOW",
  "DELIVERY_ISSUE",
  "OTHER",
] as const;

export type BuyerCancelReason = (typeof BUYER_CANCEL_REASONS)[number];

export const BUYER_CANCEL_REASON_LABELS: Record<BuyerCancelReason, string> = {
  CHANGED_MIND: "Передумав(ла)",
  FOUND_CHEAPER: "Знайшов(ла) дешевше",
  WRONG_ORDER: "Помилково оформив(ла) замовлення",
  SELLER_TOO_SLOW: "Забагато чекав(ла) на відповідь продавця",
  DELIVERY_ISSUE: "Не підходить доставка",
  OTHER: "Інша причина",
};

export const AUTO_CANCEL_REASON = "AUTO_NO_TTN";

export const AUTO_CANCEL_REASON_LABEL =
  "Не вказано ТТН протягом 3 днів (автоскасування)";

export type OrderCancelRole = "BUYER" | "SELLER" | "SYSTEM";

export type OrderCancelInput = {
  cancelReason?: string | null;
  cancelReasonNote?: string | null;
};

type OrderCancelFields = {
  status: string;
  novaPoshtaTtn?: string | null;
  cancelledByRole?: string | null;
  cancelledById?: string | null;
  buyerId?: string;
  sellerId?: string;
  createdAt?: Date | string;
};

export function isSellerCancelReason(value: string): value is SellerCancelReason {
  return (SELLER_CANCEL_REASONS as readonly string[]).includes(value);
}

export function isBuyerCancelReason(value: string): value is BuyerCancelReason {
  return (BUYER_CANCEL_REASONS as readonly string[]).includes(value);
}

export function getCancelReasonLabel(reason: string | null | undefined, note?: string | null): string {
  if (!reason) return "";
  if (reason === AUTO_CANCEL_REASON) return AUTO_CANCEL_REASON_LABEL;
  if (isSellerCancelReason(reason)) {
    const base = SELLER_CANCEL_REASON_LABELS[reason];
    if (reason === "OTHER" && note?.trim()) {
      return `${base}: ${note.trim()}`;
    }
    return base;
  }
  if (isBuyerCancelReason(reason)) {
    const base = BUYER_CANCEL_REASON_LABELS[reason];
    if (reason === "OTHER" && note?.trim()) {
      return `${base}: ${note.trim()}`;
    }
    return base;
  }
  return reason;
}

export function validateSellerCancelInput(input: OrderCancelInput): { ok: true } | { ok: false; error: string } {
  const reason = input.cancelReason?.trim();
  if (!reason || !isSellerCancelReason(reason)) {
    return { ok: false, error: "Оберіть причину скасування" };
  }
  if (reason === "OTHER" && !input.cancelReasonNote?.trim()) {
    return { ok: false, error: "Опишіть причину скасування" };
  }
  return { ok: true };
}

export function validateBuyerCancelInput(input: OrderCancelInput): { ok: true } | { ok: false; error: string } {
  const reason = input.cancelReason?.trim();
  if (!reason || !isBuyerCancelReason(reason)) {
    return { ok: false, error: "Оберіть причину скасування" };
  }
  if (reason === "OTHER" && !input.cancelReasonNote?.trim()) {
    return { ok: false, error: "Опишіть причину скасування" };
  }
  return { ok: true };
}

export function isOrderShipped(order: Pick<OrderCancelFields, "status" | "novaPoshtaTtn">): boolean {
  return order.status === "SHIPPED" && Boolean(order.novaPoshtaTtn?.trim());
}

export function isSuccessfulSale(order: Pick<OrderCancelFields, "status" | "novaPoshtaTtn">): boolean {
  return order.status === "COMPLETED" && Boolean(order.novaPoshtaTtn?.trim());
}

export function getOrderCancelRole(
  order: Pick<OrderCancelFields, "cancelledByRole" | "cancelledById" | "buyerId" | "sellerId">
): OrderCancelRole | null {
  if (order.cancelledByRole === "BUYER" || order.cancelledByRole === "SELLER" || order.cancelledByRole === "SYSTEM") {
    return order.cancelledByRole;
  }
  if (!order.cancelledById) return null;
  if (order.cancelledById === order.buyerId) return "BUYER";
  if (order.cancelledById === order.sellerId) return "SELLER";
  return null;
}

export function isBuyerCancelledOrder(order: Pick<OrderCancelFields, "status" | "cancelledByRole" | "cancelledById" | "buyerId">): boolean {
  if (order.status !== "CANCELLED") return false;
  return getOrderCancelRole(order) === "BUYER";
}

export function isSellerCancelledOrder(order: Pick<OrderCancelFields, "status" | "cancelledByRole" | "cancelledById" | "sellerId">): boolean {
  if (order.status !== "CANCELLED") return false;
  return getOrderCancelRole(order) === "SELLER";
}

export function countsTowardSellerAchievement(
  order: Pick<OrderCancelFields, "status" | "cancelledByRole" | "cancelledById" | "buyerId">
): boolean {
  if (order.status === "CANCELLED" && isBuyerCancelledOrder(order)) return true;
  return order.status !== "CANCELLED";
}

export function getTtnDeadline(createdAt: Date | string): Date {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const deadline = new Date(date);
  deadline.setDate(deadline.getDate() + ORDER_TTN_DEADLINE_DAYS);
  return deadline;
}

export function isPastTtnDeadline(createdAt: Date | string, now = new Date()): boolean {
  return now.getTime() > getTtnDeadline(createdAt).getTime();
}

export function shouldAutoCancelOrder(
  order: Pick<OrderCancelFields, "status" | "novaPoshtaTtn" | "createdAt">,
  now = new Date()
): boolean {
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") return false;
  if (order.novaPoshtaTtn?.trim()) return false;
  return isPastTtnDeadline(order.createdAt ?? now, now);
}

export function formatTtnDeadline(createdAt: Date | string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(getTtnDeadline(createdAt));
}
