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

/** Parses admin search input: ORD-10001, #ORD-10001, 10001 */
export function parseOrderNumberQuery(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ordMatch = trimmed.match(/^#?\s*ord[-\s]?(\d+)$/i);
  if (ordMatch) {
    const value = Number.parseInt(ordMatch[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  if (/^\d+$/.test(trimmed)) {
    const value = Number.parseInt(trimmed, 10);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

/** @deprecated Prefer formatOrderNumber(order.orderNumber) */
export function formatSellerOrderNumber(order: OrderNumberSource | string): string {
  if (typeof order === "string") {
    return `#${order.slice(-4).toUpperCase()}`;
  }

  return formatOrderNumber(order.orderNumber);
}
