export type PromCharacteristic = {
  name: string;
  unit: string | null;
  value: string;
};

const PROM_VARIANT_GROUP_HEADERS = ["ID_групи_різновидів"] as const;

const COLOR_NAME_PATTERN = /^(колір|color)$/i;
const SIZE_NAME_PATTERN = /^(розмір(\s+одягу)?|size)$/i;

const CHARACTERISTIC_NAME_PREFIX = "Назва_Характеристики";

function normalizeHeaderKey(value: string): string {
  return value.trim();
}

function characteristicSuffix(header: string): string {
  if (header === CHARACTERISTIC_NAME_PREFIX) return "";
  const match = header.match(/^Назва_Характеристики(?:_(.+))?$/);
  return match?.[1] ? `_${match[1]}` : "";
}

function pickRowField(row: Record<string, unknown>, key: string): unknown {
  if (key in row) return row[key];
  return undefined;
}

function normalizeCharacteristicValue(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function parsePromVariantGroupId(row: Record<string, unknown>): string | null {
  for (const header of PROM_VARIANT_GROUP_HEADERS) {
    const raw = pickRowField(row, header);
    const value = normalizeCharacteristicValue(raw);
    if (value) return value.slice(0, 32);
  }
  return null;
}

export function parsePromCharacteristicsFromRow(
  row: Record<string, unknown>
): PromCharacteristic[] {
  const characteristics: PromCharacteristic[] = [];

  for (const header of Object.keys(row)) {
    const normalizedHeader = normalizeHeaderKey(header);
    if (!normalizedHeader.startsWith(CHARACTERISTIC_NAME_PREFIX)) continue;

    const suffix = characteristicSuffix(normalizedHeader);
    const name = normalizeCharacteristicValue(row[header]);
    if (!name) continue;

    const unit = normalizeCharacteristicValue(
      pickRowField(row, `Одиниця_виміру_Характеристики${suffix}`)
    );
    const value = normalizeCharacteristicValue(
      pickRowField(row, `Значення_Характеристики${suffix}`)
    );
    if (!value) continue;

    characteristics.push({ name, unit, value });
  }

  return characteristics;
}

export function extractPromColor(characteristics: PromCharacteristic[]): string | null {
  for (const item of characteristics) {
    if (COLOR_NAME_PATTERN.test(item.name.trim())) {
      return item.value.slice(0, 120);
    }
  }
  return null;
}

export function extractPromSize(characteristics: PromCharacteristic[]): string | null {
  for (const item of characteristics) {
    if (SIZE_NAME_PATTERN.test(item.name.trim())) {
      return item.value.slice(0, 120);
    }
  }
  return null;
}

export function promCharacteristicsToDb(
  characteristics: PromCharacteristic[]
): PromCharacteristic[] | null {
  return characteristics.length > 0 ? characteristics : null;
}

function normalizePromCharacteristicItem(item: unknown): PromCharacteristic | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const value = typeof row.value === "string" ? row.value.trim() : "";
  const unit = typeof row.unit === "string" && row.unit.trim() ? row.unit.trim() : null;
  if (!name || !value) return null;
  return { name, unit, value };
}

/** Accepts Prisma Json, legacy TEXT JSON string, or null. */
export function normalizePromCharacteristics(raw: unknown): PromCharacteristic[] {
  if (raw == null) return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      return normalizePromCharacteristics(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizePromCharacteristicItem(item))
      .filter((item): item is PromCharacteristic => item !== null);
  }

  return [];
}
