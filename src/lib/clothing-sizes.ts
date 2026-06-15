import { CLOTHING_CONDITIONS, CONDITIONS, parseListingCategory } from "@/lib/constants";

export const SHOE_SIZES = [
  "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48",
] as const;

export const ADULT_CLOTHING_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
] as const;

export const CHILD_AGE_SIZES = [
  "0–3 місяці",
  "3–6 місяці",
  "6–12 місяців",
  "1 рік",
  "2 роки",
  "3 роки",
  "4 роки",
  "5 років",
  "6 років",
  "7 років",
  "8 років",
] as const;

export const CHILD_HEIGHT_SIZES = [
  "56 см",
  "62 см",
  "68 см",
  "74 см",
  "80 см",
  "86 см",
  "92 см",
  "98 см",
  "104 см",
  "110 см",
  "116 см",
  "122 см",
  "128 см",
  "134 см",
  "140 см",
  "146 см",
  "152 см",
  "158 см",
  "164 см",
] as const;

export type ClothingSizeKind = "shoe" | "adult" | "child";

const ADULT_ACCESSORY_DETAILS = new Set(["Аксесуари", "Сумки та аксесуари"]);

export function getClothingSizeKind(
  main: string,
  sub: string,
  detail?: string
): ClothingSizeKind | null {
  if (main === "Одяг і взуття" && sub === "Аксесуари") return null;

  if (
    sub === "Взуття" ||
    sub === "Дитяче взуття" ||
    (main === "Одяг і взуття" &&
      (sub === "Чоловіче" || sub === "Жіноче") &&
      detail === "Взуття")
  ) {
    return "shoe";
  }

  if (
    (main === "Для дітей" && sub === "Дитячий одяг") ||
    (main === "Одяг і взуття" && sub === "Дитяче")
  ) {
    return "child";
  }

  if (
    main === "Одяг і взуття" &&
    (sub === "Чоловіче" || sub === "Жіноче") &&
    detail &&
    !ADULT_ACCESSORY_DETAILS.has(detail)
  ) {
    return "adult";
  }

  return null;
}

export function getClothingSizeKindFromCategory(category: string): ClothingSizeKind | null {
  const { main, sub, detail } = parseListingCategory(category);
  return getClothingSizeKind(main, sub, detail || undefined);
}

export function getListingConditions(main: string, sub: string): Record<string, string> {
  if (isClothingListingCategory(main, sub)) return CLOTHING_CONDITIONS;
  return CONDITIONS;
}

export function isClothingListingCategory(main: string, sub: string): boolean {
  if (main === "Одяг і взуття") return true;
  if (main === "Для дітей" && (sub === "Дитячий одяг" || sub === "Дитяче взуття")) {
    return true;
  }
  return false;
}

export function isClothingListingCategoryFromString(category: string): boolean {
  const { main, sub } = parseListingCategory(category);
  return isClothingListingCategory(main, sub);
}

export function inferChildSizeMode(itemSize: string): "age" | "height" {
  if (CHILD_HEIGHT_SIZES.includes(itemSize as (typeof CHILD_HEIGHT_SIZES)[number])) {
    return "height";
  }
  return "age";
}

export function isValidClothingSize(kind: ClothingSizeKind, itemSize: string): boolean {
  const trimmed = itemSize.trim();
  if (!trimmed) return false;

  switch (kind) {
    case "shoe":
      return SHOE_SIZES.includes(trimmed as (typeof SHOE_SIZES)[number]);
    case "adult":
      return ADULT_CLOTHING_SIZES.includes(trimmed as (typeof ADULT_CLOTHING_SIZES)[number]);
    case "child":
      return (
        CHILD_AGE_SIZES.includes(trimmed as (typeof CHILD_AGE_SIZES)[number]) ||
        CHILD_HEIGHT_SIZES.includes(trimmed as (typeof CHILD_HEIGHT_SIZES)[number])
      );
    default:
      return false;
  }
}

export function parseClothingSizePayload(
  category: string,
  itemSize: unknown
): { ok: true; itemSize: string | null } | { ok: false; error: string } {
  const kind = getClothingSizeKindFromCategory(category);

  if (!kind) {
    return { ok: true, itemSize: null };
  }

  if (typeof itemSize !== "string" || !itemSize.trim()) {
    return { ok: false, error: "Оберіть розмір товару" };
  }

  const trimmed = itemSize.trim();
  if (!isValidClothingSize(kind, trimmed)) {
    return { ok: false, error: "Невірний розмір товару" };
  }

  return { ok: true, itemSize: trimmed };
}
