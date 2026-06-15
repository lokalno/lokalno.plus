const MIN_LISTING_STOCK = 0;

const MIN_LISTING_STOCK_ON_CREATE = 1;

const MAX_LISTING_STOCK = 9999;



type ListingStockOptions = {

  min?: number;

};



export function parseListingStock(value: unknown, options?: ListingStockOptions): number | null {

  const min = options?.min ?? MIN_LISTING_STOCK;

  const num = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(num) || num < min || num > MAX_LISTING_STOCK) {

    return null;

  }

  return num;

}



export function validateListingStock(

  value: unknown,

  options?: ListingStockOptions

):

  | { ok: true; stock: number }

  | { ok: false; error: string } {

  const min = options?.min ?? MIN_LISTING_STOCK;

  const stock = parseListingStock(value, { min });

  if (stock === null) {

    return {

      ok: false,

      error: `Вкажіть кількість від ${min} до ${MAX_LISTING_STOCK}`,

    };

  }

  return { ok: true, stock };

}



export function validateListingStockForCreate(value: unknown) {

  return validateListingStock(value, { min: MIN_LISTING_STOCK_ON_CREATE });

}



export function formatListingStock(stock: number): string {

  const n = Math.abs(stock);

  if (n % 10 === 1 && n % 100 !== 11) return `${n} штука`;

  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} штуки`;

  return `${n} штук`;

}



export type StockAvailabilityLevel = "none" | "last" | "low" | "normal";



export function getStockAvailabilityLevel(stock: number): StockAvailabilityLevel {

  if (stock <= 0) return "none";

  if (stock === 1) return "last";

  if (stock <= 5) return "low";

  return "normal";

}



export function getListingStockBadgeText(stock: number): string {

  const level = getStockAvailabilityLevel(stock);

  if (level === "none") return "Розпродано";

  if (level === "last") return "Остання штука на складі";

  if (level === "low") return `Залишилось ${formatListingStock(stock)}`;

  return `В наявності: ${formatListingStock(stock)}`;

}



export function getOrderQuantityHint(maxStock: number, quantity: number): string {

  if (maxStock === 1) {

    return "На складі лише 1 штука — замовити можна тільки її.";

  }



  if (quantity >= maxStock) {

    return `Це максимум: на складі більше немає (лише ${formatListingStock(maxStock)}).`;

  }



  if (maxStock <= 5) {

    return `На складі залишилось ${formatListingStock(maxStock)} — оберіть, скільки потрібно.`;

  }



  return `Доступно для замовлення: ${formatListingStock(maxStock)}.`;

}

