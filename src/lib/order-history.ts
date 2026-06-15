export const BUYER_ORDER_HISTORY_DAYS = 14;
export const SELLER_ORDER_HISTORY_DAYS = 30;
export const ORDER_RETURN_REQUEST_DAYS = 3;

export function getHistoryCutoffDate(days: number, now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

type OrderCompletedFields = {
  status: string;
  completedAt?: Date | string | null;
  returnRequestedAt?: Date | string | null;
};

export function getReturnRequestDeadline(completedAt: Date | string): Date {
  const date = typeof completedAt === "string" ? new Date(completedAt) : completedAt;
  const deadline = new Date(date);
  deadline.setDate(deadline.getDate() + ORDER_RETURN_REQUEST_DAYS);
  return deadline;
}

export function canRequestOrderReturn(
  order: OrderCompletedFields,
  now = new Date()
): boolean {
  if (order.status !== "COMPLETED" || !order.completedAt || order.returnRequestedAt) {
    return false;
  }

  return now.getTime() <= getReturnRequestDeadline(order.completedAt).getTime();
}

export function isReturnRequestWindowExpired(
  order: OrderCompletedFields,
  now = new Date()
): boolean {
  if (order.status !== "COMPLETED" || !order.completedAt || order.returnRequestedAt) {
    return false;
  }

  return now.getTime() > getReturnRequestDeadline(order.completedAt).getTime();
}

export function formatReturnRequestDeadline(completedAt: Date | string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(getReturnRequestDeadline(completedAt));
}
