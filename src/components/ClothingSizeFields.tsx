"use client";

import {
  ADULT_CLOTHING_SIZES,
  CHILD_AGE_SIZES,
  CHILD_HEIGHT_SIZES,
  SHOE_SIZES,
  type ClothingSizeKind,
  inferChildSizeMode,
} from "@/lib/clothing-sizes";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-gray-800">{children}</label>;
}

type ClothingSizeFieldsProps = {
  kind: ClothingSizeKind;
  itemSize: string;
  onItemSizeChange: (value: string) => void;
  childSizeMode: "age" | "height";
  onChildSizeModeChange: (mode: "age" | "height") => void;
};

export default function ClothingSizeFields({
  kind,
  itemSize,
  onItemSizeChange,
  childSizeMode,
  onChildSizeModeChange,
}: ClothingSizeFieldsProps) {
  if (kind === "shoe") {
    return (
      <div>
        <FieldLabel>
          Розмір взуття <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={itemSize} onChange={(e) => onItemSizeChange(e.target.value)} required>
          <option value="">Оберіть розмір</option>
          {SHOE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (kind === "adult") {
    return (
      <div>
        <FieldLabel>
          Розмір одягу <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={itemSize} onChange={(e) => onItemSizeChange(e.target.value)} required>
          <option value="">Оберіть розмір</option>
          {ADULT_CLOTHING_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const options = childSizeMode === "age" ? CHILD_AGE_SIZES : CHILD_HEIGHT_SIZES;

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Тип розміру</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onChildSizeModeChange("age");
              onItemSizeChange("");
            }}
            className={`rounded-lg border px-3 py-2 text-sm ${
              childSizeMode === "age"
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            За віком
          </button>
          <button
            type="button"
            onClick={() => {
              onChildSizeModeChange("height");
              onItemSizeChange("");
            }}
            className={`rounded-lg border px-3 py-2 text-sm ${
              childSizeMode === "height"
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            За зростом
          </button>
        </div>
      </div>
      <div>
        <FieldLabel>
          Розмір <span className="text-red-500">*</span>
        </FieldLabel>
        <select value={itemSize} onChange={(e) => onItemSizeChange(e.target.value)} required>
          <option value="">Оберіть розмір</option>
          {options.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function getInitialChildSizeMode(itemSize?: string | null): "age" | "height" {
  if (!itemSize) return "age";
  return inferChildSizeMode(itemSize);
}
