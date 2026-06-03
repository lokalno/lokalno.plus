import { CONDITIONS } from "@/lib/constants";

export const TRANSPORT_CATEGORY = "Транспорт";
export const CAR_SUBCATEGORY = "Легкові авто";

export const CAR_FUEL_TYPES = [
  "Бензин",
  "Дизель",
  "Газ (LPG)",
  "Гібрид",
  "Електро",
] as const;

export const CAR_TRANSMISSIONS = [
  "Механічна",
  "Автомат",
  "Робот",
  "Вариатор",
] as const;

export const CAR_BODY_TYPES = [
  "Седан",
  "Хетчбек",
  "Універсал",
  "Кросовер",
  "Позашляховик",
  "Мінівен",
  "Купе",
  "Кабріолет",
  "Пікап",
  "Фургон",
  "Інше",
] as const;

export type CarSearchParams = {
  yearFrom?: string;
  yearTo?: string;
  fuel?: string;
  transmission?: string;
  body?: string;
  mileageMax?: string;
  carCondition?: string;
  approxPrice?: string;
};

export function isCarCatalogContext(category?: string, subcategory?: string): boolean {
  if (category !== TRANSPORT_CATEGORY) return false;
  if (!subcategory || subcategory === CAR_SUBCATEGORY) return true;
  return false;
}

export function effectiveCarSubcategory(subcategory?: string): string {
  return subcategory && subcategory !== CAR_SUBCATEGORY ? subcategory : CAR_SUBCATEGORY;
}

export function isCarListingCategory(main: string, sub: string): boolean {
  return main === TRANSPORT_CATEGORY && sub === CAR_SUBCATEGORY;
}

export function parsePositiveInt(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function approxPriceRange(approxPrice: number): { min: number; max: number } {
  return {
    min: Math.max(1, Math.round(approxPrice * 0.85)),
    max: Math.round(approxPrice * 1.15),
  };
}

export function buildVehicleWhere(params: CarSearchParams & { carCondition?: string }) {
  const where: Record<string, unknown> = {};

  const yearFrom = parsePositiveInt(params.yearFrom);
  const yearTo = parsePositiveInt(params.yearTo);
  if (yearFrom || yearTo) {
    where.vehicleYear = {
      ...(yearFrom ? { gte: yearFrom } : {}),
      ...(yearTo ? { lte: yearTo } : {}),
    };
  }

  if (params.fuel && CAR_FUEL_TYPES.includes(params.fuel as (typeof CAR_FUEL_TYPES)[number])) {
    where.vehicleFuel = params.fuel;
  }

  if (
    params.transmission &&
    CAR_TRANSMISSIONS.includes(params.transmission as (typeof CAR_TRANSMISSIONS)[number])
  ) {
    where.vehicleTransmission = params.transmission;
  }

  if (params.body && CAR_BODY_TYPES.includes(params.body as (typeof CAR_BODY_TYPES)[number])) {
    where.vehicleBody = params.body;
  }

  const mileageMax = parsePositiveInt(params.mileageMax);
  if (mileageMax) {
    where.vehicleMileage = { lte: mileageMax };
  }

  if (params.carCondition && params.carCondition in CONDITIONS) {
    where.condition = params.carCondition;
  }

  return where;
}

export type VehiclePayload = {
  vehicleYear: number | null;
  vehicleFuel: string | null;
  vehicleTransmission: string | null;
  vehicleBody: string | null;
  vehicleMileage: number | null;
};

export function parseVehiclePayload(
  body: Record<string, unknown>,
  category: string
): { ok: true; data: VehiclePayload } | { ok: false; error: string } {
  const parts = category.split(" > ").map((p) => p.trim());
  const main = parts[0] ?? "";
  const sub = parts[1] ?? "";

  if (!isCarListingCategory(main, sub)) {
    return {
      ok: true,
      data: {
        vehicleYear: null,
        vehicleFuel: null,
        vehicleTransmission: null,
        vehicleBody: null,
        vehicleMileage: null,
      },
    };
  }

  const year = parsePositiveInt(String(body.vehicleYear ?? ""));
  const mileage = body.vehicleMileage === 0 || body.vehicleMileage === "0"
    ? 0
    : parsePositiveInt(String(body.vehicleMileage ?? ""));
  const fuel = typeof body.vehicleFuel === "string" ? body.vehicleFuel.trim() : "";
  const transmission =
    typeof body.vehicleTransmission === "string" ? body.vehicleTransmission.trim() : "";
  const vehicleBody = typeof body.vehicleBody === "string" ? body.vehicleBody.trim() : "";

  if (!year || year < 1950 || year > new Date().getFullYear() + 1) {
    return { ok: false, error: "Вкажіть коректний рік випуску авто" };
  }
  if (mileage === undefined || mileage > 2_000_000) {
    return { ok: false, error: "Вкажіть коректний пробіг (км)" };
  }
  if (!fuel || !CAR_FUEL_TYPES.includes(fuel as (typeof CAR_FUEL_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип палива" };
  }
  if (
    !transmission ||
    !CAR_TRANSMISSIONS.includes(transmission as (typeof CAR_TRANSMISSIONS)[number])
  ) {
    return { ok: false, error: "Оберіть коробку передач" };
  }
  if (!vehicleBody || !CAR_BODY_TYPES.includes(vehicleBody as (typeof CAR_BODY_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип кузова" };
  }

  return {
    ok: true,
    data: {
      vehicleYear: year,
      vehicleFuel: fuel,
      vehicleTransmission: transmission,
      vehicleBody,
      vehicleMileage: mileage,
    },
  };
}

export function formatVehicleMileage(km: number): string {
  return `${km.toLocaleString("uk-UA")} км`;
}

export function hasCarSearchFilters(params: CarSearchParams): boolean {
  return Boolean(
    params.yearFrom ||
      params.yearTo ||
      params.fuel ||
      params.transmission ||
      params.body ||
      params.mileageMax ||
      params.carCondition ||
      params.approxPrice
  );
}
