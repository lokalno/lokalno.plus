import { MAX_LISTING_PHOTOS } from "@/lib/constants";

const MAX_PHOTOS_JSON_BYTES = 2_500_000;
const MAX_DATA_URL_LENGTH = 280_000;

export function validateListingPhotos(photos: unknown):
  | { ok: true; photos: string[] }
  | { ok: false; error: string } {
  if (!Array.isArray(photos)) {
    return { ok: false, error: "Невірний формат фото" };
  }

  if (photos.length > MAX_LISTING_PHOTOS) {
    return { ok: false, error: `Максимум ${MAX_LISTING_PHOTOS} фото в одному оголошенні` };
  }

  for (const photo of photos) {
    if (typeof photo !== "string" || !photo.trim()) {
      return { ok: false, error: "Невірне фото в списку" };
    }
    if (photo.startsWith("data:") && photo.length > MAX_DATA_URL_LENGTH) {
      return {
        ok: false,
        error: "Одне з фото занадто велике. Спробуйте менші зображення.",
      };
    }
  }

  const serialized = JSON.stringify(photos);
  if (serialized.length > MAX_PHOTOS_JSON_BYTES) {
    return {
      ok: false,
      error: `Занадто багато великих фото (${photos.length}). Завантажте менші зображення або до ${MAX_LISTING_PHOTOS - 1} фото.`,
    };
  }

  return { ok: true, photos };
}

export function getListingPhotosPayloadSize(photos: string[]): number {
  return JSON.stringify(photos).length;
}
