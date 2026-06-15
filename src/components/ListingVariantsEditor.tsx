"use client";

import { useState } from "react";
import type { ListingVariant } from "@/lib/listing-variants";
import { sumVariantStock } from "@/lib/listing-variants";
import type { ClothingSizeKind } from "@/lib/clothing-sizes";
import {
  ADULT_CLOTHING_SIZES,
  CHILD_AGE_SIZES,
  CHILD_HEIGHT_SIZES,
  SHOE_SIZES,
} from "@/lib/clothing-sizes";

type ListingVariantsEditorProps = {
  variants: ListingVariant[];
  onChange: (variants: ListingVariant[]) => void;
  sizeKind?: ClothingSizeKind | null;
};

function getSizeSuggestions(kind?: ClothingSizeKind | null): string[] {
  if (!kind) return [];
  if (kind === "shoe") return [...SHOE_SIZES];
  if (kind === "adult") return [...ADULT_CLOTHING_SIZES];
  if (kind === "child") return [...CHILD_AGE_SIZES, ...CHILD_HEIGHT_SIZES];
  return [];
}

function createEmptyVariant(): ListingVariant {
  return { color: "", size: "", stock: 1 };
}

function clampStock(value: number): number {
  return Math.max(0, Math.min(9999, value));
}

function parseStockInput(raw: string): number {
  if (!raw.trim()) return 0;
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num)) return 0;
  return clampStock(num);
}

export default function ListingVariantsEditor({
  variants,
  onChange,
  sizeKind,
}: ListingVariantsEditorProps) {
  const sizeSuggestions = getSizeSuggestions(sizeKind);
  const totalStock = sumVariantStock(variants);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});

  function updateVariant(index: number, patch: Partial<ListingVariant>) {
    onChange(variants.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function getQuantityValue(index: number, stock: number): string {
    return quantityDrafts[index] ?? String(stock);
  }

  function handleQuantityChange(index: number, raw: string) {
    if (raw !== "" && !/^\d+$/.test(raw)) return;

    setQuantityDrafts((prev) => ({ ...prev, [index]: raw }));

    if (raw === "") {
      updateVariant(index, { stock: 0 });
    } else {
      updateVariant(index, { stock: parseStockInput(raw) });
    }
  }

  function handleQuantityBlur(index: number, stock: number) {
    const raw = quantityDrafts[index];
    const nextStock = raw !== undefined ? parseStockInput(raw) : stock;
    updateVariant(index, { stock: nextStock });
    setQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function removeVariant(index: number) {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  }

  function addVariant() {
    onChange([...variants, createEmptyVariant()]);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Варіанти товару</h3>
          <p className="mt-1 text-xs text-gray-500">
            Додайте колір, розмір і кількість для кожного варіанту. Якщо кількість 0 — варіант
            позначається як «немає в наявності».
          </p>
        </div>
        <p className="text-sm font-medium text-gray-700">
          Разом на складі: <span className="text-brand-700">{totalStock} шт.</span>
        </p>
      </div>

      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-gray-700">Колір *</label>
              <input
                value={variant.color}
                onChange={(e) => updateVariant(index, { color: e.target.value })}
                placeholder="Наприклад, чорний"
                maxLength={60}
                required
                className="w-full"
              />
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-gray-700">Розмір *</label>
              <input
                value={variant.size}
                onChange={(e) => updateVariant(index, { size: e.target.value })}
                placeholder="Наприклад, M"
                maxLength={20}
                list={sizeSuggestions.length > 0 ? "variant-size-suggestions" : undefined}
                required
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-28 sm:shrink-0">
              <label className="mb-1 block text-xs font-medium text-gray-700">Кількість *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={getQuantityValue(index, variant.stock)}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                onBlur={() => handleQuantityBlur(index, variant.stock)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div className="sm:shrink-0">
              <button
                type="button"
                onClick={() => removeVariant(index)}
                disabled={variants.length <= 1}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>

      {sizeSuggestions.length > 0 && (
        <datalist id="variant-size-suggestions">
          {sizeSuggestions.map((size) => (
            <option key={size} value={size} />
          ))}
        </datalist>
      )}

      <button
        type="button"
        onClick={addVariant}
        className="mt-4 rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        Додати варіант
      </button>
    </div>
  );
}
