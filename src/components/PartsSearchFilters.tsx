"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";
import {
  PART_FOR_VEHICLES,
  PART_POPULAR,
  PART_TYPES,
  PART_BRANDS,
  PARTS_SUBCATEGORY,
} from "@/lib/parts";
import { TRANSPORT_CATEGORY, approxPriceRange } from "@/lib/vehicle";
import { CONDITIONS } from "@/lib/constants";

export default function PartsSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [city, setCity] = useState(searchParams.get("city") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "");
  }, [searchParams]);

  const partFor = searchParams.get("partFor") || "";
  const partType = searchParams.get("partType") || "";
  const partPopular = searchParams.get("partPopular") || "";
  const partBrand = searchParams.get("partBrand") || "";
  const approxPrice = searchParams.get("approxPrice") || "";
  const partsCondition = searchParams.get("partsCondition") || "";
  const sort = searchParams.get("sort") || "new";

  function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    params.set("category", TRANSPORT_CATEGORY);
    params.set("subcategory", PARTS_SUBCATEGORY);

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

    setOrDelete("partFor", String(data.get("partFor") || "").trim());
    setOrDelete("partType", String(data.get("partType") || "").trim());
    setOrDelete("partPopular", String(data.get("partPopular") || "").trim());
    setOrDelete("partBrand", String(data.get("partBrand") || "").trim());
    setOrDelete("partsCondition", String(data.get("partsCondition") || "").trim());
    setOrDelete("sort", String(data.get("sort") || "").trim() || "new");

    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  function resetFilters() {
    setCity("");
    startTransition(() => {
      router.replace(
        `/?category=${encodeURIComponent(TRANSPORT_CATEGORY)}&subcategory=${encodeURIComponent(PARTS_SUBCATEGORY)}`,
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
        <h3 className="text-sm font-bold text-gray-900">Пошук запчастин</h3>
        {isPending && <span className="text-xs text-gray-400">завантаження…</span>}
      </div>
      <p className="text-xs text-gray-500">
        Запчастини для авто, вантажівок, мото, спец- та сільгосптехної техніки — тип деталі, ціна ±15%,
        стан.
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Для якого транспорту</label>
        <select name="partFor" defaultValue={partFor} key={`partFor-${partFor}`}>
          <option value="">Будь-який</option>
          {PART_FOR_VEHICLES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Тип деталі</label>
        <select name="partType" defaultValue={partType} key={`partType-${partType}`}>
          <option value="">Будь-який</option>
          {PART_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Марка машини</label>
        <select name="partBrand" defaultValue={partBrand} key={`partBrand-${partBrand}`}>
          <option value="">Будь-яка</option>
          {PART_BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 space-y-2">
        <p className="text-sm font-medium text-gray-800">Популярне</p>
        <select name="partPopular" defaultValue={partPopular} key={`partPopular-${partPopular}`}>
          <option value="">Не обрано</option>
          {PART_POPULAR.map((item) => (
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
          step="100"
          placeholder="Наприклад, 3500"
          defaultValue={approxPrice}
          key={`approx-${approxPrice}`}
        />
        <p className="mt-1 text-xs text-gray-400">Пошук у діапазоні ±15% від суми</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Стан</label>
        <select
          name="partsCondition"
          defaultValue={partsCondition}
          key={`cond-${partsCondition}`}
        >
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
          Знайти запчастини
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
