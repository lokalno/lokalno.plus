export function normalizeItemLocation(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, 200);
}

export function validateItemLocation(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  const normalized = normalizeItemLocation(value);
  if (!normalized || normalized.length < 2) {
    return {
      ok: false,
      error: "Вкажіть позицію на складі — де фізично лежить цей товар (мін. 2 символи)",
    };
  }
  return { ok: true, value: normalized };
}
