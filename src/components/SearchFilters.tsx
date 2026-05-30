"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "new";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function applyPrices() {
    const params = new URLSearchParams(searchParams.toString());
    const min = (document.getElementById("minPrice") as HTMLInputElement)?.value;
    const max = (document.getElementById("maxPrice") as HTMLInputElement)?.value;
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Пошук</label>
        <input
          type="text"
          placeholder="Що шукаєте?"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value);
          }}
        />
      </div>
      <SettlementSearch
        value={city}
        onChange={(value) => update("city", value)}
        label="Місто / село"
        placeholder="Вся Україна — або знайдіть населений пункт"
      />
      {city && (
        <button
          type="button"
          onClick={() => update("city", "")}
          className="text-xs text-brand-600 hover:underline -mt-1"
        >
          Показати всю Україну
        </button>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ціна (₴)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            id="minPrice"
            type="number"
            min="0"
            placeholder="Від"
            defaultValue={minPrice}
          />
          <input
            id="maxPrice"
            type="number"
            min="0"
            placeholder="До"
            defaultValue={maxPrice}
          />
        </div>
        <button
          type="button"
          onClick={applyPrices}
          className="mt-2 w-full text-sm border py-1 rounded-lg hover:bg-gray-50"
        >
          Застосувати ціну
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Сортування</label>
        <select value={sort} onChange={(e) => update("sort", e.target.value)}>
          <option value="new">Найновіші</option>
          <option value="price_asc">Дешевші</option>
          <option value="price_desc">Дорожчі</option>
          <option value="views">Популярні</option>
        </select>
      </div>
    </div>
  );
}
