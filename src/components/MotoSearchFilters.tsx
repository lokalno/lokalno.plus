"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";
import {
  MOTO_BRANDS,
  MOTO_FUEL_TYPES,
  MOTO_SUBCATEGORY,
  MOTO_TYPES,
  TRANSPORT_CATEGORY,
  approxPriceRange,
} from "@/lib/vehicle";
import { CONDITIONS } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export default function MotoSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [city, setCity] = useState(searchParams.get("city") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "");
  }, [searchParams]);

  const motoBrand = searchParams.get("motoBrand") || "";
  const motoType = searchParams.get("motoType") || "";
  const approxPrice = searchParams.get("approxPrice") || "";
  const yearFrom = searchParams.get("yearFrom") || "";
  const yearTo = searchParams.get("yearTo") || "";
  const engineVolumeFrom = searchParams.get("engineVolumeFrom") || "";
  const engineVolumeTo = searchParams.get("engineVolumeTo") || "";
  const fuel = searchParams.get("fuel") || "";
  const mileageMax = searchParams.get("mileageMax") || "";
  const motoCondition = searchParams.get("motoCondition") || "";
  const sort = searchParams.get("sort") || "new";

  function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();

    params.set("category", TRANSPORT_CATEGORY);
    params.set("subcategory", MOTO_SUBCATEGORY);

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

    setOrDelete("motoBrand", String(data.get("motoBrand") || "").trim());
    setOrDelete("motoType", String(data.get("motoType") || "").trim());
    setOrDelete("yearFrom", String(data.get("yearFrom") || "").trim());
    setOrDelete("yearTo", String(data.get("yearTo") || "").trim());
    setOrDelete("engineVolumeFrom", String(data.get("engineVolumeFrom") || "").trim());
    setOrDelete("engineVolumeTo", String(data.get("engineVolumeTo") || "").trim());
    setOrDelete("fuel", String(data.get("fuel") || "").trim());
    setOrDelete("mileageMax", String(data.get("mileageMax") || "").trim());
    setOrDelete("motoCondition", String(data.get("motoCondition") || "").trim());
    setOrDelete("sort", String(data.get("sort") || "").trim() || "new");

    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  function resetFilters() {
    setCity("");
    startTransition(() => {
      router.replace(
        `/?category=${encodeURIComponent(TRANSPORT_CATEGORY)}&subcategory=${encodeURIComponent(MOTO_SUBCATEGORY)}`,
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
        <h3 className="text-sm font-bold text-gray-900">Пошук мото</h3>
        {isPending && <span className="text-xs text-gray-400">завантаження…</span>}
      </div>
      <p className="text-xs text-gray-500">
        Мотоцикли, скутери, квадроцикли по Україні — тип, марка, ціна ±15%, рік, об&apos;єм, паливо,
        пробіг, стан.
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Тип транспорту</label>
        <select name="motoType" defaultValue={motoType} key={`type-${motoType}`}>
          <option value="">Будь-який</option>
          {MOTO_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Марка</label>
        <select name="motoBrand" defaultValue={motoBrand} key={`brand-${motoBrand}`}>
          <option value="">Будь-яка</option>
          {MOTO_BRANDS.map((item) => (
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
          step="500"
          placeholder="Наприклад, 85000"
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
            placeholder="2015"
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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Об&apos;єм від (см³)</label>
          <input
            name="engineVolumeFrom"
            type="number"
            min="50"
            step="50"
            placeholder="125"
            defaultValue={engineVolumeFrom}
            key={`volFrom-${engineVolumeFrom}`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Об&apos;єм до (см³)</label>
          <input
            name="engineVolumeTo"
            type="number"
            min="50"
            step="50"
            placeholder="600"
            defaultValue={engineVolumeTo}
            key={`volTo-${engineVolumeTo}`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Паливо</label>
        <select name="fuel" defaultValue={fuel} key={`fuel-${fuel}`}>
          <option value="">Будь-яке</option>
          {MOTO_FUEL_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Стан</label>
        <select name="motoCondition" defaultValue={motoCondition} key={`cond-${motoCondition}`}>
          <option value="">Будь-який</option>
          {Object.entries(CONDITIONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Пробіг до (км)</label>
        <input
          name="mileageMax"
          type="number"
          min="0"
          step="1000"
          placeholder="30000"
          defaultValue={mileageMax}
          key={`mileage-${mileageMax}`}
        />
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
          Знайти мото
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
