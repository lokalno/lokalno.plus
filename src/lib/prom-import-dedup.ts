import type { Listing, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PromListingLookupInput = {
  promImportKey: string | null;
  promUniqueId: string | null;
  promProductId: string | null;
  promSku: string | null;
  itemLocation: string;
};

export type PromListingLookupMatch =
  | "promImportKey"
  | "promUniqueId"
  | "promProductId"
  | "promSku"
  | "legacyItemLocation";

const LEGACY_PROM_PHOTO_MARKER = "images.prom.ua";

export function resolvePromSkuForLookup(input: PromListingLookupInput): string | null {
  const fromSku = input.promSku?.trim();
  if (fromSku) return fromSku;

  const fromLocation = input.itemLocation.trim();
  if (!fromLocation || fromLocation === "Prom") return null;
  return fromLocation;
}

export function isLegacyPromListingPhotos(photosJson: string): boolean {
  return photosJson.includes(LEGACY_PROM_PHOTO_MARKER);
}

function legacyItemLocationWhere(
  sellerId: string,
  sku: string
): Prisma.ListingWhereInput {
  return {
    sellerId,
    promImportKey: null,
    promUniqueId: null,
    promProductId: null,
    promSku: null,
    itemLocation: { equals: sku, mode: "insensitive" },
    photos: { contains: LEGACY_PROM_PHOTO_MARKER },
  };
}

export async function findExistingPromListing(
  sellerId: string,
  input: PromListingLookupInput
): Promise<{ listing: Listing; matchedBy: PromListingLookupMatch } | null> {
  if (input.promImportKey) {
    const listing = await prisma.listing.findUnique({
      where: {
        sellerId_promImportKey: {
          sellerId,
          promImportKey: input.promImportKey,
        },
      },
    });
    if (listing) return { listing, matchedBy: "promImportKey" };
  }

  if (input.promUniqueId) {
    const listing = await prisma.listing.findFirst({
      where: { sellerId, promUniqueId: input.promUniqueId },
      orderBy: { createdAt: "asc" },
    });
    if (listing) return { listing, matchedBy: "promUniqueId" };
  }

  if (input.promProductId) {
    const listing = await prisma.listing.findFirst({
      where: { sellerId, promProductId: input.promProductId },
      orderBy: { createdAt: "asc" },
    });
    if (listing) return { listing, matchedBy: "promProductId" };
  }

  const sku = resolvePromSkuForLookup(input);
  if (sku) {
    const listing = await prisma.listing.findFirst({
      where: {
        sellerId,
        promSku: { equals: sku, mode: "insensitive" },
      },
      orderBy: { createdAt: "asc" },
    });
    if (listing) return { listing, matchedBy: "promSku" };

    const legacyListing = await prisma.listing.findFirst({
      where: legacyItemLocationWhere(sellerId, sku),
      orderBy: { createdAt: "asc" },
    });
    if (legacyListing) return { listing: legacyListing, matchedBy: "legacyItemLocation" };
  }

  return null;
}
