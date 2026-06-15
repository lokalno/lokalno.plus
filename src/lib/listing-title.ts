import { LISTING_TITLE_MAX } from "@/lib/constants";

export function validateListingTitle(
  value: unknown
): { ok: true; title: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "Вкажіть назву товару" };
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { ok: false, error: "Вкажіть назву товару" };
  }

  if (trimmed.length > LISTING_TITLE_MAX) {
    return {
      ok: false,
      error: `Назва товару — не більше ${LISTING_TITLE_MAX} символів`,
    };
  }

  return { ok: true, title: trimmed };
}
