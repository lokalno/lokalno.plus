"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice, parsePhotos } from "@/lib/utils";
import { LISTING_STATUSES } from "@/lib/constants";
import SellerListingCard from "@/components/SellerListingCard";
import type { ListingWithSoldCount } from "@/lib/listing-sales";

type SellerListing = ListingWithSoldCount & {
  id: string;
  title: string;
  price: number;
  city: string;
  condition: string;
  status: string;
  stock: number;
  photos: string;
  views: number;
  itemLocation?: string | null;
  seller: { name: string };
};

type SellerListingsInventoryProps = {
  listings: SellerListing[];
};

export default function SellerListingsInventory({ listings }: SellerListingsInventoryProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">(listings.length > 24 ? "table" : "grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;

    return listings.filter((listing) => {
      const position = (listing.itemLocation || "").toLowerCase();
      const title = listing.title.toLowerCase();
      return position.includes(q) || title.includes(q);
    });
  }, [listings, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Шукати за позицією або назвою…"
            className="pl-9"
          />
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-lg px-3 py-1.5 font-medium ${
              view === "grid" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Плитка
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-lg px-3 py-1.5 font-medium ${
              view === "table" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Список
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} з {listings.length} оголошень
        {query.trim() ? ` за запитом «${query.trim()}»` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
          Нічого не знайдено. Спробуйте іншу позицію або назву.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3">
          {filtered.map((listing) => (
            <SellerListingCard key={listing.id} listing={listing} compact showStoragePosition />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Позиція на складі</th>
                <th className="px-4 py-3">Ціна</th>
                <th className="px-4 py-3">Склад</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((listing) => {
                const photos = parsePhotos(listing.photos);
                return (
                  <tr key={listing.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="line-clamp-2 font-medium text-gray-900 hover:text-brand-700"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-xs text-gray-500">{listing.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {listing.itemLocation ? (
                        <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-sm font-semibold text-amber-950 ring-1 ring-amber-200">
                          📍 {listing.itemLocation}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">Не вказано</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-700">
                      {formatPrice(listing.price)}
                    </td>
                    <td className="px-4 py-3">{listing.stock}</td>
                    <td className="px-4 py-3">
                      {LISTING_STATUSES[listing.status] || listing.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Редагувати
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
