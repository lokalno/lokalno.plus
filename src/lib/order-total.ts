import { formatListingStock } from "@/lib/listing-stock";

export function getOrderQuantity(order: { quantity?: number | null }): number {
  const quantity = order.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) return 1;
  return quantity;
}

export function getOrderUnitPrice(order: {
  unitPrice?: number | null;
  listing: { price: number };
}): number {
  if (typeof order.unitPrice === "number" && order.unitPrice > 0) {
    return order.unitPrice;
  }
  return order.listing.price;
}

export function getOrderTotalAmount(price: number, quantity: number): number {
  return price * getOrderQuantity({ quantity });
}

export function getOrderTotalFromRecord(order: {
  quantity?: number | null;
  unitPrice?: number | null;
  listing: { price: number };
}): number {
  return getOrderTotalAmount(getOrderUnitPrice(order), getOrderQuantity(order));
}

export function parseOrderQuantity(
  value: unknown,
  maxStock: number
): { ok: true; quantity: number } | { ok: false; error: string } {
  const quantity = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "Вкажіть кількість від 1" };
  }

  if (quantity > maxStock) {
    return {
      ok: false,
      error: `Доступно лише ${formatListingStock(maxStock)}`,
    };
  }

  return { ok: true, quantity };
}

export function formatOrderQuantityLabel(quantity: number): string {
  return formatListingStock(getOrderQuantity({ quantity }));
}
