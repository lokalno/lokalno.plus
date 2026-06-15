"use client";

import { useEffect, useMemo, useState } from "react";
import type { ListingVariant } from "@/lib/listing-variants";
import {
  findVariant,
  getAvailableColors,
  getAvailableSizesForColor,
  isVariantAvailable,
} from "@/lib/listing-variants";

type ListingVariantPickerProps = {
  variants: ListingVariant[];
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
};

export default function ListingVariantPicker({
  variants,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: ListingVariantPickerProps) {
  const availableColors = useMemo(() => getAvailableColors(variants), [variants]);
  const availableSizes = useMemo(
    () => (selectedColor ? getAvailableSizesForColor(variants, selectedColor) : []),
    [variants, selectedColor]
  );

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return findVariant(variants, selectedColor, selectedSize) ?? null;
  }, [variants, selectedColor, selectedSize]);

  const isSelectedUnavailable =
    selectedColor &&
    selectedSize &&
    (!selectedVariant || selectedVariant.stock <= 0);

  useEffect(() => {
    if (selectedColor && !availableColors.includes(selectedColor)) {
      onColorChange("");
      onSizeChange("");
    }
  }, [availableColors, onColorChange, onSizeChange, selectedColor]);

  useEffect(() => {
    if (selectedSize && selectedColor && !availableSizes.includes(selectedSize)) {
      onSizeChange("");
    }
  }, [availableSizes, onSizeChange, selectedColor, selectedSize]);

  if (availableColors.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        Немає в наявності. Оберіть інший розмір або колір.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">Колір</p>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onColorChange(color);
                onSizeChange("");
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                selectedColor === color
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {selectedColor && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-900">Розмір</p>
          {availableSizes.length === 0 ? (
            <p className="text-sm text-gray-500">Немає доступних розмірів для цього кольору.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeChange(size)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    selectedSize === size
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isSelectedUnavailable && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Немає в наявності. Оберіть інший розмір або колір.
        </p>
      )}

      {selectedVariant && selectedVariant.stock > 0 && (
        <p className="text-xs text-gray-500">В наявності: {selectedVariant.stock} шт.</p>
      )}
    </div>
  );
}

export function getVariantSelectionStock(
  variants: ListingVariant[],
  color: string,
  size: string
): number {
  if (!color || !size || !isVariantAvailable(variants, color, size)) return 0;
  return findVariant(variants, color, size)?.stock ?? 0;
}
