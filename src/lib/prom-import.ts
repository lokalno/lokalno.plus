import * as XLSX from "xlsx";
import { CATEGORIES, formatListingCategory, LISTING_TITLE_MAX } from "@/lib/constants";

import {
  extractPromColor,
  extractPromSize,
  parsePromCharacteristicsFromRow,
  parsePromVariantGroupId,
  promCharacteristicsToDb,
  type PromCharacteristic,
} from "@/lib/prom-import-characteristics";

export const PROM_IMPORT_BATCH_SIZE = 50;
export const PROM_IMPORT_MAX_FILE_BYTES = 4 * 1024 * 1024;
export const PROM_FALLBACK_CATEGORY = "Інше > Інше";
export const PROM_PRODUCTS_SHEET = "Export Products Sheet";

export type PromImportRow = {
  rowNumber: number;
  title: string;
  description: string;
  price: number;
  photos: string[];
  stock: number;
  brand: string | null;
  category: string;
  itemLocation: string;
  promImportKey: string | null;
  promUniqueId: string | null;
  promProductId: string | null;
  promSku: string | null;
  promColor: string | null;
  promSize: string | null;
  promVariantGroupId: string | null;
  promCharacteristics: PromCharacteristic[] | null;
};

type RawPromRow = Record<string, unknown>;

const HEADER_ALIASES = {
  title: ["Назва_позиції_укр", "Назва_позиції"],
  description: ["Опис_укр", "Опис"],
  price: ["Ціна"],
  photos: ["Посилання_зображення"],
  stock: ["Кількість"],
  brand: ["Виробник"],
  promSku: ["Код_товару"],
  promUniqueId: ["Унікальний_ідентифікатор"],
  promProductId: ["Ідентифікатор_товару"],
  groupName: ["Назва_групи"],
  groupNameUk: ["Назва_групи_укр"],
  categoryUrl: ["Посилання_підрозділу"],
  availability: ["Наявність"],
} as const;

const CATEGORY_HINTS: { pattern: RegExp; main: string; sub?: string }[] = [
  { pattern: /телефон|смартфон|iphone|android|планшет/i, main: "Електроніка", sub: "Телефони та аксесуари" },
  { pattern: /ноутбук|noutbuk|комп.?ютер|монітор|відеокарт/i, main: "Електроніка", sub: "Комп'ютери та комплектуючі" },
  { pattern: /одяг|сороч|штан|куртк|dress|футбол/i, main: "Одяг і взуття", sub: "Одяг" },
  { pattern: /взут|черевик|кросів|ботинок|туфл/i, main: "Одяг і взуття", sub: "Взуття" },
  { pattern: /мебл|диван|стіл|шаф|ліжк/i, main: "Меблі", sub: "Інше" },
  { pattern: /космет|парфум|крем|шампун/i, main: "Краса і здоров'я", sub: "Косметика" },
  { pattern: /іграш|lego|конструктор/i, main: "Іграшки", sub: "Інше" },
  { pattern: /авто|запчаст|шини|масло/i, main: "Автотовари", sub: "Інше" },
  { pattern: /спорт|velos|велосип|тренажер/i, main: "Спорт і відпочинок", sub: "Інше" },
  { pattern: /побут|пилосос|пральн|холодильник|мікрохв/i, main: "Побутова техніка", sub: "Інше" },
  { pattern: /діт|немовля|коляск/i, main: "Для дітей", sub: "Інше" },
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function pickField(row: RawPromRow, aliases: readonly string[]): unknown {
  for (const alias of aliases) {
    if (alias in row && row[alias] != null && String(row[alias]).trim() !== "") {
      return row[alias];
    }
  }
  return undefined;
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  if (trimmed.length <= LISTING_TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, LISTING_TITLE_MAX - 1).trim()}…`;
}

function parsePhotos(raw: unknown): string[] {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (!text) return [];

  return text
    .split(/,\s*/)
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 10);
}

function parsePrice(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const num = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

function parseStock(raw: unknown, availability: unknown): number | null {
  const availabilityText = String(availability ?? "").trim();
  if (availabilityText === "-" || availabilityText === "&") {
    return null;
  }

  if (raw != null && String(raw).trim() !== "") {
    const num = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".").trim());
    if (Number.isInteger(num) && num >= 1 && num <= 9999) return num;
    if (Number.isInteger(num) && num <= 0) return null;
  }

  if (availabilityText === "+" || availabilityText === "!" || availabilityText === "@") {
    return 1;
  }

  return 1;
}

function normalizePromField(value: unknown): string | null {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function buildPromImportKey(params: {
  promUniqueId: string | null;
  promProductId: string | null;
  promSku: string | null;
}): string | null {
  if (params.promUniqueId) return `prom:uid:${params.promUniqueId}`;
  if (params.promProductId) return `prom:id:${params.promProductId}`;
  if (params.promSku) return `prom:sku:${params.promSku.toLowerCase()}`;
  return null;
}

function mapPromCategory(groupName: string, categoryUrl: string): string {
  const haystack = `${groupName} ${categoryUrl}`.trim();
  if (!haystack) return PROM_FALLBACK_CATEGORY;

  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(haystack)) {
      const main = CATEGORIES.includes(hint.main as (typeof CATEGORIES)[number]) ? hint.main : "Інше";
      return formatListingCategory(main, hint.sub ?? "Інше");
    }
  }

  return PROM_FALLBACK_CATEGORY;
}

function sheetToRows(workbook: XLSX.WorkBook): RawPromRow[] {
  const sheet =
    workbook.Sheets[PROM_PRODUCTS_SHEET] ??
    workbook.Sheets[workbook.SheetNames[0] ?? ""];

  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length < 2) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    const row = matrix[i] ?? [];
    const joined = row.map((cell) => normalizeHeader(cell)).join("|");
    if (joined.includes("Назва_позиції") || joined.includes("Код_товару")) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (matrix[headerRowIndex] ?? []).map(normalizeHeader);
  const rows: RawPromRow[] = [];

  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const hasData = line.some((cell) => String(cell ?? "").trim() !== "");
    if (!hasData) continue;

    const record: RawPromRow = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = line[index] ?? "";
    });
    rows.push(record);
  }

  return rows;
}

export function parsePromImportFile(buffer: ArrayBuffer): RawPromRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  return sheetToRows(workbook);
}

export type PromRowParseResult =
  | { ok: true; row: PromImportRow }
  | { ok: false; reason: string; title?: string };

export function mapPromRowToImport(row: RawPromRow, rowNumber: number): PromRowParseResult {
  const titleRaw =
    pickField(row, HEADER_ALIASES.title) ??
    pickField(row, ["Назва_товару", "Name"]);
  const title = titleRaw ? truncateTitle(String(titleRaw)) : "";
  if (!title) {
    return { ok: false, reason: "Немає назви товару", title: undefined };
  }

  const descriptionRaw =
    pickField(row, HEADER_ALIASES.description) ??
    pickField(row, ["Description"]);
  const description = descriptionRaw ? stripHtml(String(descriptionRaw)) : "";
  if (!description) {
    return { ok: false, reason: "Немає опису", title };
  }

  const price = parsePrice(pickField(row, HEADER_ALIASES.price));
  if (price == null) {
    return { ok: false, reason: "Невірна або відсутня ціна", title };
  }

  const photos = parsePhotos(pickField(row, HEADER_ALIASES.photos));
  if (photos.length === 0) {
    return { ok: false, reason: "Немає посилання на фото", title };
  }

  const stock = parseStock(
    pickField(row, HEADER_ALIASES.stock),
    pickField(row, HEADER_ALIASES.availability)
  );
  if (stock == null) {
    return { ok: false, reason: "Товар не в наявності або нульовий залишок", title };
  }

  const brandRaw = pickField(row, HEADER_ALIASES.brand);
  const brand =
    brandRaw && String(brandRaw).trim() ? String(brandRaw).trim().slice(0, 255) : null;

  const groupName = String(
    pickField(row, HEADER_ALIASES.groupNameUk) ?? pickField(row, HEADER_ALIASES.groupName) ?? ""
  ).trim();
  const categoryUrl = String(pickField(row, HEADER_ALIASES.categoryUrl) ?? "").trim();
  const category = mapPromCategory(groupName, categoryUrl);

  const skuRaw = pickField(row, HEADER_ALIASES.promSku);
  const promSku = skuRaw ? normalizePromField(skuRaw)?.slice(0, 25) ?? null : null;
  const promUniqueId = normalizePromField(pickField(row, HEADER_ALIASES.promUniqueId));
  const promProductId =
    normalizePromField(pickField(row, HEADER_ALIASES.promProductId))?.slice(0, 255) ?? null;
  const promImportKey = buildPromImportKey({ promUniqueId, promProductId, promSku });
  const itemLocation = promSku ?? "Prom";
  const promCharacteristicsList = parsePromCharacteristicsFromRow(row);
  const promColor = extractPromColor(promCharacteristicsList);
  const promSize = extractPromSize(promCharacteristicsList);
  const promVariantGroupId = parsePromVariantGroupId(row);
  const promCharacteristics = promCharacteristicsToDb(promCharacteristicsList);

  return {
    ok: true,
    row: {
      rowNumber,
      title,
      description,
      price,
      photos,
      stock,
      brand,
      category,
      itemLocation,
      promImportKey,
      promUniqueId,
      promProductId,
      promSku,
      promColor,
      promSize,
      promVariantGroupId,
      promCharacteristics,
    },
  };
}

export function slicePromImportBatch<T>(rows: T[], offset: number, batchSize = PROM_IMPORT_BATCH_SIZE) {
  const safeOffset = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
  return {
    batch: rows.slice(safeOffset, safeOffset + batchSize),
    offset: safeOffset,
    nextOffset: safeOffset + batchSize,
    hasMore: safeOffset + batchSize < rows.length,
    totalInFile: rows.length,
  };
}
