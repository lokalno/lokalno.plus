"use client";

import { useState } from "react";
import type { ListingVariant } from "@/lib/listing-variants";
import ListingVariantPicker, { getVariantSelectionStock } from "@/components/ListingVariantPicker";
import OrderCheckoutForm from "@/components/OrderCheckoutForm";

type ListingVariantCheckoutProps = {
  listingId: string;
  variants: ListingVariant[];
  unitPrice: number;
  priceOfferId?: string;
  buyLabel?: string;
  compact?: boolean;
  activeOrderLimitMessage?: string | null;
};

export default function ListingVariantCheckout({
  listingId,
  variants,
  unitPrice,
  priceOfferId,
  buyLabel,
  compact = false,
  activeOrderLimitMessage = null,
}: ListingVariantCheckoutProps) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [variantError, setVariantError] = useState("");

  const variantStock = getVariantSelectionStock(variants, selectedColor, selectedSize);
  const hasSelection = Boolean(selectedColor && selectedSize && variantStock > 0);

  return (
    <div className="space-y-3">
      <ListingVariantPicker
        variants={variants}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onColorChange={(color) => {
          setSelectedColor(color);
          setVariantError("");
        }}
        onSizeChange={(size) => {
          setSelectedSize(size);
          setVariantError("");
        }}
      />

      {variantError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{variantError}</div>
      )}

      <OrderCheckoutForm
        listingId={listingId}
        maxStock={hasSelection ? variantStock : 1}
        unitPrice={unitPrice}
        priceOfferId={priceOfferId}
        buyLabel={buyLabel}
        compact={compact}
        activeOrderLimitMessage={activeOrderLimitMessage}
        variantColor={hasSelection ? selectedColor : undefined}
        variantSize={hasSelection ? selectedSize : undefined}
        requiresVariantSelection
        onRequireVariant={() =>
          setVariantError("Оберіть колір і розмір, які є в наявності.")
        }
        disableCheckout={!hasSelection}
      />
    </div>
  );
}
