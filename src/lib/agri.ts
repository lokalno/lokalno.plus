import { CONDITIONS, formatListingCategory } from "@/lib/constants";
import { TRANSPORT_CATEGORY, approxPriceRange, parsePositiveInt } from "@/lib/vehicle";

export const AGRI_SUBCATEGORY = "Сільськогосподарська техніка";
/** Old misspelling kept for matching existing listings in DB */
export const AGRI_SUBCATEGORY_LEGACY = "Сільгосподарська техніка";

export const AGRI_BRANDS = [
  "John Deere",
  "CLAAS",
  "New Holland",
  "Case IH",
  "MTZ",
  "Інше",
] as const;

export const AGRI_TYPES = [
  "Трактори",
  "Комбайни",
  "Сівалки",
  "Обприскувачі",
  "Інше",
] as const;

export type AgriSearchParams = {
  agriBrand?: string;
  agriType?: string;
  yearFrom?: string;
  yearTo?: string;
  agriCondition?: string;
  approxPrice?: string;
};

export type AgriListingPayload = {
  brand: string | null;
  vehicleType: string | null;
  vehicleYear: number | null;
  vehicleFuel: null;
  vehicleTransmission: null;
  vehicleBody: null;
  vehicleMileage: null;
  vehicleEngineVolume: null;
  vehicleLoadCapacity: null;
};

export function isAgriCatalogContext(category?: string, subcategory?: string): boolean {
  return (
    category === TRANSPORT_CATEGORY &&
    (subcategory === AGRI_SUBCATEGORY || subcategory === AGRI_SUBCATEGORY_LEGACY)
  );
}

export function isAgriListingCategory(main: string, sub: string): boolean {
  return (
    main === TRANSPORT_CATEGORY &&
    (sub === AGRI_SUBCATEGORY || sub === AGRI_SUBCATEGORY_LEGACY)
  );
}

export function buildAgriListingCategoryFilter() {
  const prefixes = [AGRI_SUBCATEGORY, AGRI_SUBCATEGORY_LEGACY].map((sub) =>
    formatListingCategory(TRANSPORT_CATEGORY, sub)
  );
  return {
    OR: prefixes.flatMap((prefix) => [
      { category: prefix },
      { category: { startsWith: `${prefix} >` } },
    ]),
  };
}

export function normalizeAgriBrand(brand: string | null | undefined): string | null {
  const trimmed = typeof brand === "string" ? brand.trim() : "";
  if (!trimmed || trimmed === "Інше") return null;
  if (AGRI_BRANDS.includes(trimmed as (typeof AGRI_BRANDS)[number])) return trimmed;
  return null;
}

export function buildAgriWhere(params: AgriSearchParams & { agriCondition?: string }) {
  const where: Record<string, unknown> = {};

  const brand = params.agriBrand?.trim();
  if (brand && brand !== "Інше" && AGRI_BRANDS.includes(brand as (typeof AGRI_BRANDS)[number])) {
    where.brand = brand;
  }

  if (params.agriType && AGRI_TYPES.includes(params.agriType as (typeof AGRI_TYPES)[number])) {
    if (params.agriType !== "Інше") {
      where.vehicleType = params.agriType;
    }
  }

  const yearFrom = parsePositiveInt(params.yearFrom);
  const yearTo = parsePositiveInt(params.yearTo);
  if (yearFrom || yearTo) {
    where.vehicleYear = {
      ...(yearFrom ? { gte: yearFrom } : {}),
      ...(yearTo ? { lte: yearTo } : {}),
    };
  }

  if (params.agriCondition && params.agriCondition in CONDITIONS) {
    where.condition = params.agriCondition;
  }

  return where;
}

export function parseAgriListingPayload(
  body: Record<string, unknown>
): { ok: true; data: AgriListingPayload } | { ok: false; error: string } {
  const brandRaw = typeof body.brand === "string" ? body.brand.trim() : "";
  const brand = normalizeAgriBrand(brandRaw);
  const vehicleType = typeof body.vehicleType === "string" ? body.vehicleType.trim() : "";
  const year = parsePositiveInt(String(body.vehicleYear ?? ""));

  if (!brandRaw || !AGRI_BRANDS.includes(brandRaw as (typeof AGRI_BRANDS)[number])) {
    return { ok: false, error: "Оберіть марку техніки" };
  }
  if (!vehicleType || !AGRI_TYPES.includes(vehicleType as (typeof AGRI_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип техніки" };
  }
  if (!year || year < 1950 || year > new Date().getFullYear() + 1) {
    return { ok: false, error: "Вкажіть коректний рік випуску" };
  }

  return {
    ok: true,
    data: {
      brand,
      vehicleType: vehicleType === "Інше" ? null : vehicleType,
      vehicleYear: year,
      vehicleFuel: null,
      vehicleTransmission: null,
      vehicleBody: null,
      vehicleMileage: null,
      vehicleEngineVolume: null,
      vehicleLoadCapacity: null,
    },
  };
}

export function hasAgriSearchFilters(params: AgriSearchParams): boolean {
  return Boolean(
    params.agriBrand ||
      params.agriType ||
      params.yearFrom ||
      params.yearTo ||
      params.agriCondition ||
      params.approxPrice
  );
}

export { approxPriceRange };
