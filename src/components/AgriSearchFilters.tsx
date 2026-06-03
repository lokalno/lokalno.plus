"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";
import {
  AGRI_BRANDS,
  AGRI_SUBCATEGORY,
  AGRI_TYPES,
  approxPriceRange,
} from "@/lib/agri";
import { TRANSPORT_CATEGORY } from "@/lib/vehicle";
import { CONDITIONS } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export default function AgriSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [city, setCity] = useState(searchParams.get("city") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "");
  }, [searchParams]);

  const agriBrand = searchParams.get("agriBrand") || "";
  const agriType = searchParams.get("agriType") || "";
  const approxPrice = searchParams.get("approxPrice") || "";
  const yearFrom = searchParams.get("yearFrom") || "";
  const yearTo = searchParams.get("yearTo") || "";
  const agriCondition = searchParams.get("agriCondition") || "";
  const sort = searchParams.get("sort") || "new";

  function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    params.set("category", TRANSPORT_CATEGORY);
    params.set("subcategory", AGRI_SUBCATEGORY);

    if (city.trim()) params.set("city", city.trim());

    const nextApprox = String(data.get("approxPrice") || "").trim();
    if (nextApprox) {
      const numeric = Number(nextApprox);
      if (numeric > 0) {
        params.set("approxPrice", nextApprox);
        const range = approxPriceRange(numeric);
        params.set("minPrice", String(range.min));
        params.set("maxPrice", String(range.max));
      }
    }

    const setOrDelete = (key: string, value: string) => {
      if (value) params.set(key, value);
    };

    setOrDelete("agriBrand", String(data.get("agriBrand") || "").trim());
    setOrDelete("agriType", String(data.get("agriType") || "").trim());
    setOrDelete("yearFrom", String(data.get("yearFrom") || "").trim());
    setOrDelete("yearTo", String(data.get("yearTo") || "").trim());
    setOrDelete("agriCondition", String(data.get("agriCondition") || "").trim());
    setOrDelete("sort", String(data.get("sort") || "").trim() || "new");

    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  function resetFilters() {
    setCity("");
    startTransition(() => {
      router.replace(
        `/?category=${encodeURIComponent(TRANSPORT_CATEGORY)}&subcategory=${encodeURIComponent(AGRI_SUBCATEGORY)}`,
        { scroll: false }
      );
    });
  }

  return (
    <form
      onSubmit={applySearch}
      className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Пошук сільськогосподарської техніки</h3>
        {isPending && <span className="text-xs text-gray-400">завантаження…</span>}
      </div>
      <p className="text-xs text-gray-500">
        Трактори, комбайни, сівалки, обприскувачі — марка, ціна ±15%, рік, стан.
      </p>

      <SettlementSearch
        value={city}
        onChange={setCity}
        label="Місто"
        placeholder="Вся Україна — або оберіть місто"
      />
      {city && (
        <button
          type="button"
          onClick={() => setCity("")}
          className="text-xs text-brand-600 hover:underline -mt-1"
        >
          Показати всю Україну
        </button>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Марка</label>
        <select name="agriBrand" defaultValue={agriBrand} key={`brand-${agriBrand}`}>
          <option value="">Будь-яка</option>
          {AGRI_BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Тип техніки</label>
        <select name="agriType" defaultValue={agriType} key={`type-${agriType}`}>
          <option value="">Будь-який</option>
          {AGRI_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Орієнтовна ціна (₴)</label>
        <input
          name="approxPrice"
          type="number"
          min="1"
          step="1000"
          placeholder="Наприклад, 850000"
          defaultValue={approxPrice}
          key={`approx-${approxPrice}`}
        />
        <p className="mt-1 text-xs text-gray-400">Пошук у діапазоні ±15% від суми</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Рік від</label>
          <input
            name="yearFrom"
            type="number"
            min="1950"
            max={currentYear}
            placeholder="2010"
            defaultValue={yearFrom}
            key={`yearFrom-${yearFrom}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Рік до</label>
          <input
            name="yearTo"
            type="number"
            min="1950"
            max={currentYear + 1}
            placeholder={String(currentYear)}
            defaultValue={yearTo}
            key={`yearTo-${yearTo}`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Стан</label>
        <select name="agriCondition" defaultValue={agriCondition} key={`cond-${agriCondition}`}>
          <option value="">Будь-який</option>
          {Object.entries(CONDITIONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Сортування</label>
        <select name="sort" defaultValue={sort} key={`sort-${sort}`}>
          <option value="new">Найновіші</option>
          <option value="price_asc">Дешевші</option>
          <option value="price_desc">Дорожчі</option>
          <option value="views">Популярні</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Знайти техніку
        </button>
        <button
          type="button"
          onClick={resetFilters}
          disabled={isPending}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Скинути
        </button>
      </div>
    </form>
  );
}
