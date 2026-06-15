import { parseListingCategory } from "@/lib/constants";

export type ListingVariant = {
  color: string;
  size: string;
  stock: number;
};

export function isClothingVariantsCategory(category: string): boolean {
  const { main } = parseListingCategory(category);
  return main === "Одяг і взуття";
}

export function parseListingVariants(raw: string | null | undefined): ListingVariant[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const color = typeof row.color === "string" ? row.color.trim() : "";
        const size = typeof row.size === "string" ? row.size.trim() : "";
        const stock =
          typeof row.stock === "number" && Number.isFinite(row.stock)
            ? Math.max(0, Math.floor(row.stock))
            : 0;
        if (!color || !size) return null;
        return { color, size, stock };
      })
      .filter((item): item is ListingVariant => item !== null);
  } catch {
    return [];
  }
}

export function listingUsesVariants(listing: {
  category: string;
  variants?: string | null;
}): boolean {
  if (!isClothingVariantsCategory(listing.category)) return false;
  return parseListingVariants(listing.variants).length > 0;
}

export function serializeListingVariants(variants: ListingVariant[]): string {
  return JSON.stringify(variants);
}

export function sumVariantStock(variants: ListingVariant[]): number {
  return variants.reduce((sum, item) => sum + item.stock, 0);
}

export function validateListingVariants(
  variants: ListingVariant[],
  category: string
): { ok: true; variants: ListingVariant[] } | { ok: false; error: string } {
  if (!isClothingVariantsCategory(category)) {
    return { ok: false, error: "Варіанти доступні лише для категорії «Одяг і взуття»." };
  }
  if (variants.length === 0) {
    return { ok: false, error: "Додайте хоча б один варіант товару." };
  }

  const normalized: ListingVariant[] = [];
  const seen = new Set<string>();

  for (const item of variants) {
    const color = item.color.trim();
    const size = item.size.trim();
    if (!color || !size) {
      return { ok: false, error: "У кожного варіанту мають бути колір і розмір." };
    }
    if (!Number.isInteger(item.stock) || item.stock < 0) {
      return { ok: false, error: "Кількість має бути цілим числом від 0 і більше." };
    }

    const key = `${color.toLowerCase()}::${size.toLowerCase()}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: `Дублікат варіанту: ${color}, ${size}. Об'єднайте кількість в один рядок.`,
      };
    }
    seen.add(key);
    normalized.push({ color, size, stock: item.stock });
  }

  return { ok: true, variants: normalized };
}

export function findVariant(
  variants: ListingVariant[],
  color: string,
  size: string
): ListingVariant | undefined {
  const colorNorm = color.trim().toLowerCase();
  const sizeNorm = size.trim().toLowerCase();
  return variants.find(
    (item) =>
      item.color.toLowerCase() === colorNorm && item.size.toLowerCase() === sizeNorm
  );
}

export function isVariantAvailable(
  variants: ListingVariant[],
  color: string,
  size: string
): boolean {
  const variant = findVariant(variants, color, size);
  return !!variant && variant.stock > 0;
}

export function getAvailableColors(variants: ListingVariant[]): string[] {
  const colors = new Set<string>();
  for (const item of variants) {
    if (item.stock > 0) colors.add(item.color);
  }
  return Array.from(colors);
}

export function getAvailableSizesForColor(
  variants: ListingVariant[],
  color: string
): string[] {
  const colorNorm = color.trim().toLowerCase();
  return variants
    .filter((item) => item.color.toLowerCase() === colorNorm && item.stock > 0)
    .map((item) => item.size);
}

export function decrementVariantStock(
  variants: ListingVariant[],
  color: string,
  size: string,
  quantity: number
): ListingVariant[] | null {
  const index = variants.findIndex(
    (item) =>
      item.color.toLowerCase() === color.trim().toLowerCase() &&
      item.size.toLowerCase() === size.trim().toLowerCase()
  );
  if (index === -1) return null;

  const next = variants.map((item) => ({ ...item }));
  if (next[index].stock < quantity) return null;
  next[index].stock -= quantity;
  return next;
}

export function incrementVariantStock(
  variants: ListingVariant[],
  color: string,
  size: string,
  quantity: number
): ListingVariant[] | null {
  const index = variants.findIndex(
    (item) =>
      item.color.toLowerCase() === color.trim().toLowerCase() &&
      item.size.toLowerCase() === size.trim().toLowerCase()
  );
  if (index === -1) return null;

  const next = variants.map((item) => ({ ...item }));
  next[index].stock += quantity;
  return next;
}
