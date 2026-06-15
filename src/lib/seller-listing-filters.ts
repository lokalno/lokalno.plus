import { formatListingCategory, parseListingCategory } from "@/lib/constants";

export type SellerCategoryFilter = {
  main: string;
  sub: string;
  detail: string;
};

export type SellerListingWithCategory = {
  category: string;
};

export type CategoryFacetOption = {
  value: string;
  count: number;
};

export type SellerCategoryFacets = {
  mains: CategoryFacetOption[];
  subs: CategoryFacetOption[];
  details: CategoryFacetOption[];
};

export const EMPTY_SELLER_CATEGORY_FILTER: SellerCategoryFilter = {
  main: "",
  sub: "",
  detail: "",
};

/** Prefix match — same semantics as buildListingCategoryFilter, client-side. */
export function matchesSellerCategoryFilter(
  category: string,
  filter: SellerCategoryFilter
): boolean {
  if (!filter.main) return true;

  if (filter.detail && filter.sub) {
    const prefix = formatListingCategory(filter.main, filter.sub, filter.detail);
    return category === prefix || category.startsWith(`${prefix} >`);
  }
  if (filter.sub) {
    const prefix = formatListingCategory(filter.main, filter.sub);
    return category === prefix || category.startsWith(`${prefix} >`);
  }
  return category === filter.main || category.startsWith(`${filter.main} >`);
}

export function hasActiveSellerCategoryFilter(filter: SellerCategoryFilter): boolean {
  return Boolean(filter.main);
}

export function buildSellerCategoryFacets(
  listings: SellerListingWithCategory[],
  filter: SellerCategoryFilter
): SellerCategoryFacets {
  const mainCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();
  const detailCounts = new Map<string, number>();

  for (const listing of listings) {
    const parsed = parseListingCategory(listing.category);
    mainCounts.set(parsed.main, (mainCounts.get(parsed.main) ?? 0) + 1);

    if (filter.main && parsed.main !== filter.main) continue;

    if (parsed.sub) {
      subCounts.set(parsed.sub, (subCounts.get(parsed.sub) ?? 0) + 1);
    }

    if (filter.sub && parsed.sub !== filter.sub) continue;

    if (parsed.detail) {
      detailCounts.set(parsed.detail, (detailCounts.get(parsed.detail) ?? 0) + 1);
    }
  }

  const toOptions = (map: Map<string, number>): CategoryFacetOption[] =>
    [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "uk"))
      .map(([value, count]) => ({ value, count }));

  return {
    mains: toOptions(mainCounts),
    subs: filter.main ? toOptions(subCounts) : [],
    details: filter.main && filter.sub ? toOptions(detailCounts) : [],
  };
}

export function filterSellerListings<T extends SellerListingWithCategory>(
  listings: T[],
  filter: SellerCategoryFilter
): T[] {
  if (!filter.main) return listings;
  return listings.filter((listing) => matchesSellerCategoryFilter(listing.category, filter));
}
