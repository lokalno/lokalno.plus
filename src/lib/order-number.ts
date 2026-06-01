export const ORDER_NUMBER_START = 10001;

export type OrderNumberSource = {
  orderNumber?: number | null;
  id: string;
};

export function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (typeof orderNumber === "number" && Number.isFinite(orderNumber)) {
    return `#ORD-${orderNumber}`;
  }

  return "#ORD-?????";
}

/** @deprecated Prefer formatOrderNumber(order.orderNumber) */
export function formatSellerOrderNumber(order: OrderNumberSource | string): string {
  if (typeof order === "string") {
    return `#${order.slice(-4).toUpperCase()}`;
  }

  return formatOrderNumber(order.orderNumber);
}
