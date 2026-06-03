import { CONDITIONS } from "@/lib/constants";
import { TRANSPORT_CATEGORY } from "@/lib/vehicle";

export const PARTS_SUBCATEGORY = "Запчастини";

export const PART_FOR_AGRICULTURAL = "Сільгосптехніка";
/** Old value with Latin "gosp" in DB — do not show in UI */
export const PART_FOR_AGRICULTURAL_LEGACY = "Сільgospтехніка";

export const PART_FOR_VEHICLES = [
  "Легкові авто",
  "Вантажівки",
  "Мотоцикли",
  "Спецтехніка",
  PART_FOR_AGRICULTURAL,
] as const;

function matchesPartForVehicle(
  value: string,
  option: (typeof PART_FOR_VEHICLES)[number]
): boolean {
  if (option === PART_FOR_AGRICULTURAL) {
    return value === PART_FOR_AGRICULTURAL || value === PART_FOR_AGRICULTURAL_LEGACY;
  }
  return value === option;
}

function partForVehicleFilterValue(
  partFor: string
): string | { in: string[] } | undefined {
  if (matchesPartForVehicle(partFor, PART_FOR_AGRICULTURAL)) {
    return { in: [PART_FOR_AGRICULTURAL, PART_FOR_AGRICULTURAL_LEGACY] };
  }
  if (PART_FOR_VEHICLES.includes(partFor as (typeof PART_FOR_VEHICLES)[number])) {
    return partFor;
  }
  return undefined;
}

function normalizePartForVehicle(value: string): string | null {
  if (value === PART_FOR_AGRICULTURAL || value === PART_FOR_AGRICULTURAL_LEGACY) {
    return PART_FOR_AGRICULTURAL;
  }
  if (PART_FOR_VEHICLES.includes(value as (typeof PART_FOR_VEHICLES)[number])) {
    return value;
  }
  return null;
}

export const PART_TYPES = [
  "Двигун",
  "Коробка передач",
  "Підвиска",
  "Гальмівна система",
  "Кузовні деталі",
  "Оптика",
  "Електрика",
  "Салон",
  "Вихлопна система",
  "Паливна система",
  "Система охолодження",
] as const;

export const PART_POPULAR = [
  "Шини",
  "Диски",
  "Фари",
  "Дзеркала",
  "Бампери",
  "Радіатори",
  "Стартер",
  "Генератор",
  "Інше",
] as const;

export const PART_BRANDS = [
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Volkswagen",
  "Toyota",
  "Nissan",
  "Honda",
  "Hyundai",
  "Kia",
  "Renault",
  "Ford",
  "Opel",
  "Skoda",
  "Mazda",
  "Інші",
] as const;

export type PartsSearchParams = {
  partFor?: string;
  partType?: string;
  partPopular?: string;
  partBrand?: string;
  partsCondition?: string;
  approxPrice?: string;
};

export type PartsListingPayload = {
  partForVehicle: string | null;
  partType: string | null;
  partPopular: string | null;
  brand: string | null;
};

export function isPartsCatalogContext(category?: string, subcategory?: string): boolean {
  return category === TRANSPORT_CATEGORY && subcategory === PARTS_SUBCATEGORY;
}

export function isPartsListingCategory(main: string, sub: string): boolean {
  return main === TRANSPORT_CATEGORY && sub === PARTS_SUBCATEGORY;
}

export function buildPartsWhere(params: PartsSearchParams & { partsCondition?: string }) {
  const where: Record<string, unknown> = {};

  if (
    params.partFor &&
    PART_FOR_VEHICLES.includes(params.partFor as (typeof PART_FOR_VEHICLES)[number])
  ) {
    where.partForVehicle = params.partFor;
  }

  if (params.partType && PART_TYPES.includes(params.partType as (typeof PART_TYPES)[number])) {
    where.partType = params.partType;
  }

  if (
    params.partPopular &&
    PART_POPULAR.includes(params.partPopular as (typeof PART_POPULAR)[number]) &&
    params.partPopular !== "Інше"
  ) {
    where.partPopular = params.partPopular;
  }

  if (
    params.partBrand &&
    PART_BRANDS.includes(params.partBrand as (typeof PART_BRANDS)[number]) &&
    params.partBrand !== "Інші"
  ) {
    where.brand = params.partBrand;
  }

  if (params.partsCondition && params.partsCondition in CONDITIONS) {
    where.condition = params.partsCondition;
  }

  return where;
}

export function normalizePartsBrand(brand: string | null | undefined): string | null {
  const trimmed = typeof brand === "string" ? brand.trim() : "";
  if (!trimmed || trimmed === "Інші") return null;
  if (PART_BRANDS.includes(trimmed as (typeof PART_BRANDS)[number])) return trimmed;
  return null;
}

export function parsePartsListingPayload(
  body: Record<string, unknown>
): { ok: true; data: PartsListingPayload } | { ok: false; error: string } {
  const partForVehicle =
    typeof body.partForVehicle === "string" ? body.partForVehicle.trim() : "";
  const partType = typeof body.partType === "string" ? body.partType.trim() : "";
  const partPopularRaw =
    typeof body.partPopular === "string" ? body.partPopular.trim() : "";
  const partPopular =
    partPopularRaw && PART_POPULAR.includes(partPopularRaw as (typeof PART_POPULAR)[number])
      ? partPopularRaw
      : null;
  const brandRaw = typeof body.brand === "string" ? body.brand.trim() : "";
  const brand = normalizePartsBrand(brandRaw);

  if (
    !partForVehicle ||
    !PART_FOR_VEHICLES.includes(partForVehicle as (typeof PART_FOR_VEHICLES)[number])
  ) {
    return { ok: false, error: "Оберіть, для якого транспорту запчастина" };
  }
  if (!partType || !PART_TYPES.includes(partType as (typeof PART_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип деталі" };
  }
  if (brandRaw && brandRaw !== "Інші" && !brand) {
    return { ok: false, error: "Оберіть марку зі списку" };
  }

  return {
    ok: true,
    data: {
      partForVehicle,
      partType,
      partPopular: partPopular === "Інше" ? null : partPopular,
      brand,
    },
  };
}

export function hasPartsSearchFilters(params: PartsSearchParams): boolean {
  return Boolean(
    params.partFor ||
      params.partType ||
      params.partPopular ||
      params.partBrand ||
      params.partsCondition ||
      params.approxPrice
  );
}
