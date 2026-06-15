import { parsePhotos } from "@/lib/utils";

export type ListingDuplicateInput = {
  id: string;
  title: string;
  price: number;
  sellerId: string;
  photos: string;
  status: string;
  createdAt: Date;
  promImportKey: string | null;
  promUniqueId: string | null;
  promProductId: string | null;
  promSku: string | null;
  seller?: { name: string; email: string };
  city?: string;
};

export type DuplicateMatchReason =
  | "promImportKey"
  | "promUniqueId"
  | "promProductId"
  | "promSku"
  | "titlePricePhotos";

export type AdminListingDuplicateGroup = {
  groupKey: string;
  reason: DuplicateMatchReason;
  listingIds: string[];
};

export type AdminListingDuplicateReport = {
  totalPending: number;
  duplicateGroupCount: number;
  duplicateListingCount: number;
  groups: AdminListingDuplicateGroup[];
};

export type AdminListingDuplicateSibling = {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  sellerName: string;
  sellerEmail: string;
  city: string;
  promLabel: string;
  matchReasonLabel: string;
  hasPhotos: boolean;
  isCurrent: boolean;
};

const REASON_LABELS: Record<DuplicateMatchReason, string> = {
  promImportKey: "Однаковий Prom ключ (promImportKey)",
  promUniqueId: "Однаковий Унікальний_ідентифікатор Prom",
  promProductId: "Однаковий Ідентифікатор_товару Prom",
  promSku: "Однаковий артикул (Код_товару)",
  titlePricePhotos: "Однакові назва, ціна та фото",
};

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePrice(price: number): number {
  return Math.round(price * 100) / 100;
}

function photosSignature(photosJson: string): string {
  const photos = parsePhotos(photosJson);
  if (photos.length === 0) return "";
  return photos
    .map((photo) => photo.trim())
    .sort()
    .join("|");
}

function buildSoftDuplicateKey(listing: ListingDuplicateInput): string {
  return [
    listing.sellerId,
    normalizeTitle(listing.title),
    String(normalizePrice(listing.price)),
    photosSignature(listing.photos),
  ].join("||");
}

function promLabel(listing: ListingDuplicateInput): string {
  if (listing.promImportKey) return listing.promImportKey;
  if (listing.promUniqueId) return `uid:${listing.promUniqueId}`;
  if (listing.promProductId) return `id:${listing.promProductId}`;
  if (listing.promSku) return `sku:${listing.promSku}`;
  return "—";
}

function addToGroup(
  groups: Map<string, AdminListingDuplicateGroup>,
  key: string,
  reason: DuplicateMatchReason,
  listingId: string
) {
  const existing = groups.get(key);
  if (existing) {
    if (!existing.listingIds.includes(listingId)) {
      existing.listingIds.push(listingId);
    }
    return;
  }
  groups.set(key, { groupKey: key, reason, listingIds: [listingId] });
}

export function findPendingListingDuplicateGroups(
  listings: ListingDuplicateInput[]
): AdminListingDuplicateReport {
  const groupsMap = new Map<string, AdminListingDuplicateGroup>();

  for (const listing of listings) {
    if (listing.promImportKey) {
      addToGroup(
        groupsMap,
        `promImportKey:${listing.sellerId}:${listing.promImportKey}`,
        "promImportKey",
        listing.id
      );
    }
    if (listing.promUniqueId) {
      addToGroup(
        groupsMap,
        `promUniqueId:${listing.sellerId}:${listing.promUniqueId}`,
        "promUniqueId",
        listing.id
      );
    }
    if (listing.promProductId) {
      addToGroup(
        groupsMap,
        `promProductId:${listing.sellerId}:${listing.promProductId}`,
        "promProductId",
        listing.id
      );
    }
    if (listing.promSku) {
      addToGroup(
        groupsMap,
        `promSku:${listing.sellerId}:${listing.promSku.trim().toLowerCase()}`,
        "promSku",
        listing.id
      );
    }

    const softKey = buildSoftDuplicateKey(listing);
    if (softKey.endsWith("||")) continue;
    addToGroup(groupsMap, `soft:${softKey}`, "titlePricePhotos", listing.id);
  }

  const groups = [...groupsMap.values()].filter((group) => group.listingIds.length >= 2);

  const duplicateListingIds = new Set<string>();
  for (const group of groups) {
    for (const id of group.listingIds) {
      duplicateListingIds.add(id);
    }
  }

  return {
    totalPending: listings.length,
    duplicateGroupCount: groups.length,
    duplicateListingCount: duplicateListingIds.size,
    groups: groups.sort((a, b) => b.listingIds.length - a.listingIds.length),
  };
}

export function buildListingDuplicateIndex(
  listings: ListingDuplicateInput[],
  report: AdminListingDuplicateReport
): Map<string, AdminListingDuplicateGroup[]> {
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const index = new Map<string, AdminListingDuplicateGroup[]>();

  for (const group of report.groups) {
    for (const listingId of group.listingIds) {
      if (!listingById.has(listingId)) continue;
      const current = index.get(listingId) ?? [];
      current.push(group);
      index.set(listingId, current);
    }
  }

  return index;
}

export function isPossibleDuplicate(listingId: string, index: Map<string, AdminListingDuplicateGroup[]>) {
  return (index.get(listingId)?.length ?? 0) > 0;
}

export function getDuplicateSiblingsForListing(
  listingId: string,
  listings: ListingDuplicateInput[],
  index: Map<string, AdminListingDuplicateGroup[]>
): AdminListingDuplicateSibling[] {
  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const groups = index.get(listingId) ?? [];
  const siblingIds = new Set<string>();

  for (const group of groups) {
    for (const id of group.listingIds) {
      siblingIds.add(id);
    }
  }

  const matchReasonBySibling = new Map<string, DuplicateMatchReason>();

  for (const siblingId of siblingIds) {
    if (siblingId === listingId) continue;
    for (const group of groups) {
      if (!group.listingIds.includes(siblingId)) continue;
      const existing = matchReasonBySibling.get(siblingId);
      if (!existing || group.reason === "promImportKey") {
        matchReasonBySibling.set(siblingId, group.reason);
      }
    }
  }

  const siblings: AdminListingDuplicateSibling[] = [];

  const current = listingById.get(listingId);
  if (current) {
    siblings.push({
      id: current.id,
      title: current.title,
      price: current.price,
      status: current.status,
      createdAt: current.createdAt.toISOString(),
      sellerName: current.seller?.name ?? "—",
      sellerEmail: current.seller?.email ?? "",
      city: current.city ?? "",
      promLabel: promLabel(current),
      matchReasonLabel: "Поточне оголошення",
      hasPhotos: parsePhotos(current.photos).length > 0,
      isCurrent: true,
    });
  }

  for (const siblingId of siblingIds) {
    if (siblingId === listingId) continue;
    const listing = listingById.get(siblingId);
    if (!listing) continue;
    const reason = matchReasonBySibling.get(siblingId) ?? "titlePricePhotos";
    siblings.push({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      status: listing.status,
      createdAt: listing.createdAt.toISOString(),
      sellerName: listing.seller?.name ?? "—",
      sellerEmail: listing.seller?.email ?? "",
      city: listing.city ?? "",
      promLabel: promLabel(listing),
      matchReasonLabel: REASON_LABELS[reason],
      hasPhotos: parsePhotos(listing.photos).length > 0,
      isCurrent: false,
    });
  }

  return siblings.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getDuplicateReasonLabel(reason: DuplicateMatchReason): string {
  return REASON_LABELS[reason];
}

export function serializeDuplicateSiblingsMap(
  listings: ListingDuplicateInput[],
  index: Map<string, AdminListingDuplicateGroup[]>
): Record<string, AdminListingDuplicateSibling[]> {
  const result: Record<string, AdminListingDuplicateSibling[]> = {};
  for (const listingId of index.keys()) {
    result[listingId] = getDuplicateSiblingsForListing(listingId, listings, index);
  }
  return result;
}
