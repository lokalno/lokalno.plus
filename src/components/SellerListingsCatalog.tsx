"use client";

import { useMemo, useState } from "react";
import ListingCard from "@/components/ListingCard";
import {
  buildSellerCategoryFacets,
  EMPTY_SELLER_CATEGORY_FILTER,
  filterSellerListings,
  hasActiveSellerCategoryFilter,
  type SellerCategoryFilter,
} from "@/lib/seller-listing-filters";
import { cn } from "@/lib/utils";

type CatalogListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  condition: string;
  photos: string;
  views?: number;
  category: string;
  seller: { name: string; storeName?: string | null };
};

type SellerListingsCatalogProps = {
  listings: CatalogListing[];
  /** Компактна сітка для мобільного профілю продавця. */
  compact?: boolean;
  /** Початковий фільтр (лише для dev/preview). */
  initialFilter?: SellerCategoryFilter;
};

function formatCountLabel(count: number): string {
  if (count === 1) return "1 товар";
  if (count >= 2 && count <= 4) return `${count} товари`;
  return `${count} товарів`;
}

const PAGE_SIZE = 48;

function facetOptionLabel(option: { value: string; count: number }): string {
  return `${option.value} (${option.count})`;
}

export default function SellerListingsCatalog({
  listings,
  compact = false,
  initialFilter = EMPTY_SELLER_CATEGORY_FILTER,
}: SellerListingsCatalogProps) {
  const [filter, setFilter] = useState<SellerCategoryFilter>(initialFilter);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const facets = useMemo(
    () => buildSellerCategoryFacets(listings, filter),
    [listings, filter]
  );

  const filteredListings = useMemo(
    () => filterSellerListings(listings, filter),
    [listings, filter]
  );

  const visibleListings = useMemo(
    () => filteredListings.slice(0, visibleCount),
    [filteredListings, visibleCount]
  );

  const filterActive = hasActiveSellerCategoryFilter(filter);

  function applyFilter(next: SellerCategoryFilter) {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  }

  function setMain(main: string) {
    applyFilter({ main, sub: "", detail: "" });
  }

  function setSub(sub: string) {
    applyFilter({ ...filter, sub, detail: "" });
  }

  function setDetail(detail: string) {
    applyFilter({ ...filter, detail });
  }

  function resetFilter() {
    applyFilter(EMPTY_SELLER_CATEGORY_FILTER);
  }

  const selectClassName =
    "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900">Фільтр товарів</p>
          <button
            type="button"
            onClick={resetFilter}
            disabled={!filterActive}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
              filterActive
                ? "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
            )}
          >
            Усі товари ({listings.length})
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-gray-600">Категорія</span>
            <select
              value={filter.main}
              onChange={(e) => setMain(e.target.value)}
              className={selectClassName}
              aria-label="Категорія"
            >
              <option value="">Усі категорії</option>
              {facets.mains.map((option) => (
                <option key={option.value} value={option.value}>
                  {facetOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-gray-600">Підкатегорія</span>
            <select
              value={filter.sub}
              onChange={(e) => setSub(e.target.value)}
              disabled={!filter.main || facets.subs.length === 0}
              className={selectClassName}
              aria-label="Підкатегорія"
            >
              <option value="">Усі підкатегорії</option>
              {facets.subs.map((option) => (
                <option key={option.value} value={option.value}>
                  {facetOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-gray-600">Розділ</span>
            <select
              value={filter.detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={!filter.main || !filter.sub || facets.details.length === 0}
              className={selectClassName}
              aria-label="Розділ"
            >
              <option value="">Усі розділи</option>
              {facets.details.map((option) => (
                <option key={option.value} value={option.value}>
                  {facetOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Показано {filteredListings.length} з {listings.length} товарів
        </p>
      </div>

      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Нічого не знайдено в цій категорії
          {filterActive && (
            <button
              type="button"
              onClick={resetFilter}
              className="mt-3 block w-full font-medium text-brand-700 hover:underline"
            >
              Показати всі товари ({formatCountLabel(listings.length)})
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            compact
              ? "grid grid-cols-2 gap-2"
              : "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3"
          }
        >
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {filteredListings.length > visibleCount && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Показати ще ({filteredListings.length - visibleCount} залишилось)
          </button>
        </div>
      )}
    </div>
  );
}
