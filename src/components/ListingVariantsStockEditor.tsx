"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingVariant } from "@/lib/listing-variants";
import { sumVariantStock } from "@/lib/listing-variants";
import { formatListingStock } from "@/lib/listing-stock";

type ListingVariantsStockEditorProps = {
  listingId: string;
  initialVariants: ListingVariant[];
};

function clampStock(value: number): number {
  return Math.max(0, Math.min(9999, value));
}

function parseStockInput(raw: string): number {
  if (!raw.trim()) return 0;
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num)) return 0;
  return clampStock(num);
}

function variantsEqual(a: ListingVariant[], b: ListingVariant[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.color === b[index].color &&
      item.size === b[index].size &&
      item.stock === b[index].stock
  );
}

export default function ListingVariantsStockEditor({
  listingId,
  initialVariants,
}: ListingVariantsStockEditorProps) {
  const router = useRouter();
  const [variants, setVariants] = useState(initialVariants);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setVariants(initialVariants);
    setQuantityDrafts({});
  }, [initialVariants]);

  const totalStock = useMemo(() => sumVariantStock(variants), [variants]);
  const isDirty = useMemo(() => !variantsEqual(variants, initialVariants), [variants, initialVariants]);

  function getQuantityValue(index: number, stock: number): string {
    return quantityDrafts[index] ?? String(stock);
  }

  function handleQuantityChange(index: number, raw: string) {
    if (raw !== "" && !/^\d+$/.test(raw)) return;

    setQuantityDrafts((prev) => ({ ...prev, [index]: raw }));
    setVariants((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, stock: raw === "" ? 0 : parseStockInput(raw) } : item
      )
    );
  }

  function handleQuantityBlur(index: number) {
    const raw = quantityDrafts[index];
    if (raw === undefined) return;

    const nextStock = parseStockInput(raw);
    setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, stock: nextStock } : item)));
    setQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function normalizeVariants(source: ListingVariant[]): ListingVariant[] {
    return source.map((item, index) => {
      const raw = quantityDrafts[index];
      if (raw === undefined) return item;
      return { ...item, stock: parseStockInput(raw) };
    });
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");

    const payload = normalizeVariants(variants);
    setVariants(payload);
    setQuantityDrafts({});

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не вдалося зберегти");

      setSuccess("Кількість оновлено");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка збереження");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div className="mb-3 border-b border-brand-100 pb-3">
        <p className="text-sm font-semibold text-brand-900">Наявність по варіантах</p>
        <p className="mt-1 text-xs text-brand-700">
          Разом: {formatListingStock(totalStock)}
          {totalStock <= 0 && " · товар розпроданий"}
        </p>
      </div>

      <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
        {variants.map((variant, index) => (
          <div
            key={`${variant.color}-${variant.size}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{variant.color}</p>
              <p className="truncate text-xs text-gray-500">Розмір {variant.size}</p>
            </div>
            <div className="shrink-0">
              <label className="sr-only">
                Кількість {variant.color}, {variant.size}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={getQuantityValue(index, variant.stock)}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                onBlur={() => handleQuantityBlur(index)}
                className="w-16 text-center text-sm"
                aria-label={`Кількість ${variant.color}, розмір ${variant.size}`}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !isDirty}
        className="mt-4 w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Збереження..." : "Зберегти кількість"}
      </button>

      <p className="mt-2 text-[11px] leading-snug text-gray-500">
        Поставте 0, якщо розмір або колір тимчасово відсутній. Колір і розмір змінюються через
        «Редагувати».
      </p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-brand-700">{success}</p>}
    </aside>
  );
}
