import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkListingContent } from "@/lib/moderation";
import { validateListingPhotos } from "@/lib/listing-photos";
import { validateListingStockForCreate } from "@/lib/listing-stock";
import { validateItemLocation } from "@/lib/listing-location";
import { validateListingTitle } from "@/lib/listing-title";
import { getInitialListingStatus } from "@/lib/user-check";
import { mirrorListingPhotos } from "@/lib/mirror-listing-photo";
import {
  advancePromImportSession,
  hashPromImportFile,
  resolvePromImportSession,
  toPromImportSessionView,
} from "@/lib/prom-import-session";
import { findExistingPromListing } from "@/lib/prom-import-dedup";
import {
  mapPromRowToImport,
  parsePromImportFile,
  slicePromImportBatch,
  type PromImportRow,
} from "@/lib/prom-import";
import type { PromCharacteristic } from "@/lib/prom-import-characteristics";

export type PromImportDetail = {
  rowNumber: number;
  title?: string;
  reason?: string;
  listingId?: string;
};

export type PromImportBatchResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  details: {
    created: PromImportDetail[];
    updated: PromImportDetail[];
    skipped: PromImportDetail[];
    errors: PromImportDetail[];
    warnings: PromImportDetail[];
  };
  totalInFile: number;
  offset: number;
  nextOffset: number;
  hasMore: boolean;
  batchSize: number;
  sessionId: string;
  fileHash: string;
  session: ReturnType<typeof toPromImportSessionView>;
};

const NO_PROM_LOOKUP_WARNING =
  "Створено без Prom ID / артикулу — при повторному імпорті можливі дублікати";

type ValidatedPromListing = {
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string | null;
  city: string;
  itemLocation: string;
  photos: string[];
  stock: number;
  promImportKey: string | null;
  promUniqueId: string | null;
  promProductId: string | null;
  promSku: string | null;
  promColor: string | null;
  promSize: string | null;
  promVariantGroupId: string | null;
  promCharacteristics: PromCharacteristic[] | null;
};

async function validatePromListingRow(
  sellerId: string,
  row: PromImportRow,
  city: string
): Promise<{ ok: true; data: ValidatedPromListing } | { ok: false; reason: string }> {
  const titleCheck = validateListingTitle(row.title);
  if (!titleCheck.ok) return { ok: false, reason: titleCheck.error };

  const itemLocationCheck = validateItemLocation(row.itemLocation);
  if (!itemLocationCheck.ok) return { ok: false, reason: itemLocationCheck.error };

  const forbidden = checkListingContent(titleCheck.title, row.description);
  if (forbidden) {
    return { ok: false, reason: `Заборонене слово «${forbidden}»` };
  }

  const photosCheck = validateListingPhotos(row.photos);
  if (!photosCheck.ok) return { ok: false, reason: photosCheck.error };

  const hostedPhotos = await mirrorListingPhotos(photosCheck.photos, sellerId);
  const hostedPhotosCheck = validateListingPhotos(hostedPhotos);
  if (!hostedPhotosCheck.ok) return { ok: false, reason: hostedPhotosCheck.error };

  const stockCheck = validateListingStockForCreate(row.stock);
  if (!stockCheck.ok) return { ok: false, reason: stockCheck.error };

  return {
    ok: true,
    data: {
      title: titleCheck.title,
      description: row.description,
      price: row.price,
      category: row.category,
      brand: row.brand,
      city,
      itemLocation: itemLocationCheck.value,
      photos: hostedPhotosCheck.photos,
      stock: stockCheck.stock,
      promImportKey: row.promImportKey,
      promUniqueId: row.promUniqueId,
      promProductId: row.promProductId,
      promSku: row.promSku,
      promColor: row.promColor,
      promSize: row.promSize,
      promVariantGroupId: row.promVariantGroupId,
      promCharacteristics: row.promCharacteristics,
    },
  };
}

async function upsertListingFromPromRow(
  sellerId: string,
  data: ValidatedPromListing,
  initialStatus: string
): Promise<
  | { ok: true; listingId: string; action: "created" | "updated"; warning?: string }
  | { ok: false; reason: string }
> {
  const listingPayload = {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    brand: data.brand,
    condition: "NEW" as const,
    city: data.city,
    itemLocation: data.itemLocation,
    photos: JSON.stringify(data.photos),
    stock: data.stock,
    promImportKey: data.promImportKey,
    promUniqueId: data.promUniqueId,
    promProductId: data.promProductId,
    promSku: data.promSku,
    promColor: data.promColor,
    promSize: data.promSize,
    promVariantGroupId: data.promVariantGroupId,
    promCharacteristics: data.promCharacteristics
      ? (data.promCharacteristics as Prisma.InputJsonValue)
      : Prisma.DbNull,
  };

  try {
    const existingMatch = await findExistingPromListing(sellerId, {
      promImportKey: data.promImportKey,
      promUniqueId: data.promUniqueId,
      promProductId: data.promProductId,
      promSku: data.promSku,
      itemLocation: data.itemLocation,
    });

    if (existingMatch) {
      const updated = await prisma.listing.update({
        where: { id: existingMatch.listing.id },
        data: {
          ...listingPayload,
          status: existingMatch.listing.status,
        },
      });
      return { ok: true, listingId: updated.id, action: "updated" };
    }

    const listing = await prisma.listing.create({
      data: {
        ...listingPayload,
        allowPriceOffers: false,
        allowSelfPickup: false,
        sellerId,
        status: initialStatus,
      },
    });

    const hasLookupKey = Boolean(
      data.promImportKey ||
        data.promUniqueId ||
        data.promProductId ||
        data.promSku ||
        (data.itemLocation.trim() && data.itemLocation.trim() !== "Prom")
    );

    return {
      ok: true,
      listingId: listing.id,
      action: "created",
      warning: hasLookupKey ? undefined : NO_PROM_LOOKUP_WARNING,
    };
  } catch {
    return { ok: false, reason: "Помилка збереження в базі" };
  }
}

export async function runPromImportBatch(params: {
  buffer: ArrayBuffer;
  sellerId: string;
  city: string;
  fileName: string | null;
  forceRestart?: boolean;
  confirmReimport?: boolean;
}): Promise<PromImportBatchResult> {
  const fileHash = hashPromImportFile(params.buffer);
  const rawRows = parsePromImportFile(params.buffer);
  const totalInFile = rawRows.length;

  const { sessionId, offset } = await resolvePromImportSession({
    sellerId: params.sellerId,
    fileHash,
    fileName: params.fileName,
    totalRows: totalInFile,
    forceRestart: params.forceRestart,
    confirmReimport: params.confirmReimport,
  });

  const { batch, nextOffset, hasMore } = slicePromImportBatch(rawRows, offset);

  const initialStatus = await getInitialListingStatus();
  const fallbackCity = params.city.trim() || "Київ";

  const details: PromImportBatchResult["details"] = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
    warnings: [],
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let index = 0; index < batch.length; index++) {
    const raw = batch[index]!;
    const rowNumber = offset + index + 2;

    const mapped = mapPromRowToImport(raw, rowNumber);
    if (!mapped.ok) {
      skipped += 1;
      details.skipped.push({
        rowNumber,
        title: mapped.title,
        reason: mapped.reason,
      });
      continue;
    }

    const validated = await validatePromListingRow(params.sellerId, mapped.row, fallbackCity);
    if (!validated.ok) {
      errors += 1;
      details.errors.push({
        rowNumber,
        title: mapped.row.title,
        reason: validated.reason,
      });
      continue;
    }

    const result = await upsertListingFromPromRow(
      params.sellerId,
      validated.data,
      initialStatus
    );

    if (result.ok) {
      if (result.action === "updated") {
        updated += 1;
        details.updated.push({
          rowNumber,
          title: mapped.row.title,
          listingId: result.listingId,
        });
      } else {
        created += 1;
        details.created.push({
          rowNumber,
          title: mapped.row.title,
          listingId: result.listingId,
        });
        if (result.warning) {
          details.warnings.push({
            rowNumber,
            title: mapped.row.title,
            reason: result.warning,
          });
        }
      }
    } else {
      errors += 1;
      details.errors.push({
        rowNumber,
        title: mapped.row.title,
        reason: result.reason,
      });
    }
  }

  await advancePromImportSession(sessionId, nextOffset, totalInFile);

  const sessionRecord = await prisma.promImportSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  return {
    created,
    updated,
    skipped,
    errors,
    details,
    totalInFile,
    offset,
    nextOffset,
    hasMore,
    batchSize: batch.length,
    sessionId,
    fileHash,
    session: toPromImportSessionView(sessionRecord),
  };
}
