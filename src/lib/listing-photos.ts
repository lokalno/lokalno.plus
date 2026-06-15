import { MAX_LISTING_PHOTOS } from "@/lib/constants";
import { isListingVideo } from "@/lib/listing-media";
import { parsePhotos } from "@/lib/utils";

const MAX_PHOTOS_JSON_BYTES = 2_500_000;
const MAX_DATA_URL_LENGTH = 280_000;
const MIN_LISTING_MEDIA = 1;

export function validateListingPhotos(photos: unknown):
  | { ok: true; photos: string[] }
  | { ok: false; error: string } {
  if (!Array.isArray(photos)) {
    return { ok: false, error: "Невірний формат медіа" };
  }

  if (photos.length < MIN_LISTING_MEDIA) {
    return { ok: false, error: "Додайте мінімум одне фото або відео до оголошення" };
  }

  if (photos.length > MAX_LISTING_PHOTOS) {
    return { ok: false, error: `Максимум ${MAX_LISTING_PHOTOS} фото або відео в одному оголошенні` };
  }

  for (const photo of photos) {
    if (typeof photo !== "string" || !photo.trim()) {
      return { ok: false, error: "Невірний файл у списку медіа" };
    }
    if (photo.startsWith("/uploads/") || photo.startsWith("/videos/")) {
      return {
        ok: false,
        error: "Файл не збережено на сервері. Завантажте фото або відео ще раз.",
      };
    }
    if (isListingVideo(photo) && photo.startsWith("data:")) {
      return {
        ok: false,
        error: "Відео потрібно завантажити через форму, а не вставляти напряму.",
      };
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
      error: `Занадто багато великих файлів (${photos.length}). Завантажте менші фото або до ${MAX_LISTING_PHOTOS - 1} файлів.`,
    };
  }

  return { ok: true, photos };
}

export function getListingPhotosPayloadSize(photos: string[]): number {
  return JSON.stringify(photos).length;
}

export function isBrokenStoredPhoto(photo: string): boolean {
  return photo.startsWith("/uploads/") || photo.startsWith("/videos/");
}

export function countBrokenPhotos(photos: string[]): number {
  return photos.filter(isBrokenStoredPhoto).length;
}

export function hasListingPhotos(photosJson: string): boolean {
  return parsePhotos(photosJson).length > 0;
}

/** Keep only the cover image for catalog cards and list APIs (avoids multi‑MB base64 payloads). */
export function photosJsonForListCard(photos: string): string {
  const parsed = parsePhotos(photos);
  if (parsed.length === 0) return "[]";
  return JSON.stringify([parsed[0]]);
}

export function withListingCoverPhotoOnly<T extends { photos: string }>(listing: T): T {
  return { ...listing, photos: photosJsonForListCard(listing.photos) };
}
