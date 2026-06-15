import {
  normalizePromCharacteristics,
  type PromCharacteristic,
} from "@/lib/prom-import-characteristics";

type PromListingSpecInput = {
  promColor?: string | null;
  promSize?: string | null;
  promCharacteristics?: unknown;
};

type ListingSpecRow = {
  label: string;
  value: string;
};

const SKIP_CHARACTERISTIC_NAMES =
  /^(колір|color|розмір(\s+одягу)?|size)$/i;

function formatCharacteristicValue(item: PromCharacteristic): string {
  if (item.unit?.trim()) {
    return `${item.value} ${item.unit.trim()}`;
  }
  return item.value;
}

export function buildPromListingSpecs(
  listing: PromListingSpecInput,
  options?: { usesVariants?: boolean; hasItemSize?: boolean }
): ListingSpecRow[] {
  const specs: ListingSpecRow[] = [];
  const usesVariants = options?.usesVariants ?? false;
  const hasItemSize = options?.hasItemSize ?? false;

  if (!usesVariants && listing.promColor?.trim()) {
    specs.push({ label: "Колір (Prom)", value: listing.promColor.trim() });
  }

  if (!usesVariants && !hasItemSize && listing.promSize?.trim()) {
    specs.push({ label: "Розмір (Prom)", value: listing.promSize.trim() });
  }

  const characteristics = normalizePromCharacteristics(listing.promCharacteristics);
  for (const item of characteristics) {
    if (SKIP_CHARACTERISTIC_NAMES.test(item.name.trim())) continue;
    specs.push({
      label: item.name.trim(),
      value: formatCharacteristicValue(item),
    });
  }

  return specs;
}
