const MIN_LISTING_STOCK = 1;
const MAX_LISTING_STOCK = 9999;

export function parseListingStock(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num) || num < MIN_LISTING_STOCK || num > MAX_LISTING_STOCK) {
    return null;
  }
  return num;
}

export function validateListingStock(value: unknown):
  | { ok: true; stock: number }
  | { ok: false; error: string } {
  const stock = parseListingStock(value);
  if (stock === null) {
    return {
      ok: false,
      error: `Вкажіть кількість від ${MIN_LISTING_STOCK} до ${MAX_LISTING_STOCK}`,
    };
  }
  return { ok: true, stock };
}

export function formatListingStock(stock: number): string {
  const n = Math.abs(stock);
  if (n % 10 === 1 && n % 100 !== 11) return `${n} штука`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} штуки`;
  return `${n} штук`;
}
