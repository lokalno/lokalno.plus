import { CONDITIONS } from "@/lib/constants";

export const TRANSPORT_CATEGORY = "Транспорт";
export const CAR_SUBCATEGORY = "Легкові авто";
export const MOTO_SUBCATEGORY = "Мото";

export const CAR_FUEL_TYPES = [
  "Бензин",
  "Дизель",
  "Газ (LPG)",
  "Гібрид",
  "Електро",
] as const;

export const MOTO_FUEL_TYPES = ["Бензин", "Електро"] as const;

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

export const MOTO_TYPES = [
  "Мотоцикл",
  "Скутер",
  "Мопед",
  "Квадроцикл",
  "Ендуро",
  "Кросові мотоцикли",
  "Спортивні",
  "Чопер",
  "Туристичні",
  "Електромотоцикл",
] as const;

export const CAR_BRANDS = [
  "Audi",
  "BMW",
  "BYD",
  "Chery",
  "Chevrolet",
  "Citroën",
  "Daewoo",
  "Fiat",
  "Ford",
  "Geely",
  "Honda",
  "Hyundai",
  "Kia",
  "Lada",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Renault",
  "Skoda",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
  "Інша",
] as const;

export const MOTO_BRANDS = [
  "Honda",
  "Yamaha",
  "Suzuki",
  "Kawasaki",
  "BMW",
  "Ducati",
  "KTM",
  "Harley-Davidson",
  "CFMoto",
  "Geon",
  "Forte",
  "Інші",
] as const;

export type CarSearchParams = {
  carBrand?: string;
  yearFrom?: string;
  yearTo?: string;
  fuel?: string;
  transmission?: string;
  body?: string;
  mileageMax?: string;
  carCondition?: string;
  approxPrice?: string;
};

export type MotoSearchParams = {
  motoBrand?: string;
  motoType?: string;
  yearFrom?: string;
  yearTo?: string;
  engineVolumeFrom?: string;
  engineVolumeTo?: string;
  fuel?: string;
  mileageMax?: string;
  motoCondition?: string;
  approxPrice?: string;
};

export type TransportSearchParams = CarSearchParams & MotoSearchParams;

export function isCarCatalogContext(category?: string, subcategory?: string): boolean {
  if (category !== TRANSPORT_CATEGORY) return false;
  if (!subcategory || subcategory === CAR_SUBCATEGORY) return true;
  return false;
}

export function isMotoCatalogContext(category?: string, subcategory?: string): boolean {
  return category === TRANSPORT_CATEGORY && subcategory === MOTO_SUBCATEGORY;
}

export function effectiveCarSubcategory(subcategory?: string): string {
  return subcategory && subcategory !== CAR_SUBCATEGORY ? subcategory : CAR_SUBCATEGORY;
}

export function isCarListingCategory(main: string, sub: string): boolean {
  return main === TRANSPORT_CATEGORY && sub === CAR_SUBCATEGORY;
}

export function isMotoListingCategory(main: string, sub: string): boolean {
  return main === TRANSPORT_CATEGORY && sub === MOTO_SUBCATEGORY;
}

export function parsePositiveInt(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseNonNegativeInt(value?: string | number): number | undefined {
  if (value === 0 || value === "0") return 0;
  if (typeof value === "number") return value >= 0 ? value : undefined;
  return parsePositiveInt(String(value));
}

export function approxPriceRange(approxPrice: number): { min: number; max: number } {
  return {
    min: Math.max(1, Math.round(approxPrice * 0.85)),
    max: Math.round(approxPrice * 1.15),
  };
}

function buildSharedTransportWhere(params: {
  yearFrom?: string;
  yearTo?: string;
  fuel?: string;
  mileageMax?: string;
  condition?: string;
  allowedFuels: readonly string[];
}) {
  const where: Record<string, unknown> = {};

  const yearFrom = parsePositiveInt(params.yearFrom);
  const yearTo = parsePositiveInt(params.yearTo);
  if (yearFrom || yearTo) {
    where.vehicleYear = {
      ...(yearFrom ? { gte: yearFrom } : {}),
      ...(yearTo ? { lte: yearTo } : {}),
    };
  }

  if (params.fuel && params.allowedFuels.includes(params.fuel)) {
    where.vehicleFuel = params.fuel;
  }

  const mileageMax = parsePositiveInt(params.mileageMax);
  if (mileageMax) {
    where.vehicleMileage = { lte: mileageMax };
  }

  if (params.condition && params.condition in CONDITIONS) {
    where.condition = params.condition;
  }

  return where;
}

export function buildVehicleWhere(params: CarSearchParams & { carCondition?: string }) {
  const where: Record<string, unknown> = {
    ...buildSharedTransportWhere({
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      fuel: params.fuel,
      mileageMax: params.mileageMax,
      condition: params.carCondition,
      allowedFuels: CAR_FUEL_TYPES,
    }),
  };

  const brandQuery = params.carBrand?.trim();
  if (brandQuery && brandQuery !== "Інша") {
    where.brand = { contains: brandQuery, mode: "insensitive" };
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

  return where;
}

export function buildMotoWhere(params: MotoSearchParams & { motoCondition?: string }) {
  const where: Record<string, unknown> = {
    ...buildSharedTransportWhere({
      yearFrom: params.yearFrom,
      yearTo: params.yearTo,
      fuel: params.fuel,
      mileageMax: params.mileageMax,
      condition: params.motoCondition,
      allowedFuels: MOTO_FUEL_TYPES,
    }),
  };

  const brandQuery = params.motoBrand?.trim();
  if (brandQuery && brandQuery !== "Інші") {
    where.brand = { contains: brandQuery, mode: "insensitive" };
  }

  if (params.motoType && MOTO_TYPES.includes(params.motoType as (typeof MOTO_TYPES)[number])) {
    where.vehicleType = params.motoType;
  }

  const engineFrom = parsePositiveInt(params.engineVolumeFrom);
  const engineTo = parsePositiveInt(params.engineVolumeTo);
  if (engineFrom || engineTo) {
    where.vehicleEngineVolume = {
      ...(engineFrom ? { gte: engineFrom } : {}),
      ...(engineTo ? { lte: engineTo } : {}),
    };
  }

  return where;
}

export type TransportVehiclePayload = {
  vehicleYear: number | null;
  vehicleFuel: string | null;
  vehicleTransmission: string | null;
  vehicleBody: string | null;
  vehicleMileage: number | null;
  vehicleType: string | null;
  vehicleEngineVolume: number | null;
};

const emptyTransportPayload: TransportVehiclePayload = {
  vehicleYear: null,
  vehicleFuel: null,
  vehicleTransmission: null,
  vehicleBody: null,
  vehicleMileage: null,
  vehicleType: null,
  vehicleEngineVolume: null,
};

export function parseTransportVehiclePayload(
  body: Record<string, unknown>,
  category: string
): { ok: true; data: TransportVehiclePayload } | { ok: false; error: string } {
  const parts = category.split(" > ").map((p) => p.trim());
  const main = parts[0] ?? "";
  const sub = parts[1] ?? "";

  if (isCarListingCategory(main, sub)) {
    return parseCarPayload(body);
  }
  if (isMotoListingCategory(main, sub)) {
    return parseMotoPayload(body);
  }
  return { ok: true, data: emptyTransportPayload };
}

function parseCarPayload(
  body: Record<string, unknown>
): { ok: true; data: TransportVehiclePayload } | { ok: false; error: string } {
  const year = parsePositiveInt(String(body.vehicleYear ?? ""));
  const mileage = parseNonNegativeInt(body.vehicleMileage as string | number | undefined);
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
      vehicleType: null,
      vehicleEngineVolume: null,
    },
  };
}

function parseMotoPayload(
  body: Record<string, unknown>
): { ok: true; data: TransportVehiclePayload } | { ok: false; error: string } {
  const year = parsePositiveInt(String(body.vehicleYear ?? ""));
  const mileage = parseNonNegativeInt(body.vehicleMileage as string | number | undefined);
  const fuel = typeof body.vehicleFuel === "string" ? body.vehicleFuel.trim() : "";
  const vehicleType = typeof body.vehicleType === "string" ? body.vehicleType.trim() : "";
  const engineVolume = parsePositiveInt(String(body.vehicleEngineVolume ?? ""));

  if (!year || year < 1950 || year > new Date().getFullYear() + 1) {
    return { ok: false, error: "Вкажіть коректний рік випуску" };
  }
  if (mileage === undefined || mileage > 500_000) {
    return { ok: false, error: "Вкажіть коректний пробіг (км)" };
  }
  if (!fuel || !MOTO_FUEL_TYPES.includes(fuel as (typeof MOTO_FUEL_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип палива" };
  }
  if (!vehicleType || !MOTO_TYPES.includes(vehicleType as (typeof MOTO_TYPES)[number])) {
    return { ok: false, error: "Оберіть тип транспорту" };
  }
  if (!engineVolume || engineVolume > 3000) {
    return { ok: false, error: "Вкажіть об'єм двигуна (см³)" };
  }

  return {
    ok: true,
    data: {
      vehicleYear: year,
      vehicleFuel: fuel,
      vehicleTransmission: null,
      vehicleBody: null,
      vehicleMileage: mileage,
      vehicleType,
      vehicleEngineVolume: engineVolume,
    },
  };
}

/** @deprecated Use parseTransportVehiclePayload */
export function parseVehiclePayload(
  body: Record<string, unknown>,
  category: string
): { ok: true; data: TransportVehiclePayload } | { ok: false; error: string } {
  return parseTransportVehiclePayload(body, category);
}

export type VehiclePayload = TransportVehiclePayload;

export function formatVehicleMileage(km: number): string {
  return `${km.toLocaleString("uk-UA")} км`;
}

export function formatEngineVolume(cc: number): string {
  return `${cc.toLocaleString("uk-UA")} см³`;
}

export function hasCarSearchFilters(params: CarSearchParams): boolean {
  return Boolean(
    params.carBrand ||
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

export function hasMotoSearchFilters(params: MotoSearchParams): boolean {
  return Boolean(
    params.motoBrand ||
      params.motoType ||
      params.yearFrom ||
      params.yearTo ||
      params.engineVolumeFrom ||
      params.engineVolumeTo ||
      params.fuel ||
      params.mileageMax ||
      params.motoCondition ||
      params.approxPrice
  );
}

export function hasTransportSearchFilters(params: TransportSearchParams): boolean {
  return hasCarSearchFilters(params) || hasMotoSearchFilters(params);
}
