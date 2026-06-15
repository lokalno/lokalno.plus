import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { isExternalListingPhotoUrl } from "@/lib/listing-image-hosts";

const MAX_MIRRORED_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function mirrorListingPhotoUrl(
  url: string,
  sellerId: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  if (!isExternalListingPhotoUrl(url)) return url;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LokalnoPlus/1.0; +https://lokalno.plus)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_MIRRORED_BYTES) return null;

    const filename = `prom-${randomUUID()}.${extensionForContentType(contentType)}`;
    const blob = await put(`uploads/${sellerId}/${filename}`, buffer, {
      access: "public",
      contentType,
    });

    return blob.url;
  } catch {
    return null;
  }
}

export async function mirrorListingPhotos(
  photos: string[],
  sellerId: string
): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return photos;

  return Promise.all(
    photos.map(async (photo) => {
      if (!isExternalListingPhotoUrl(photo)) return photo;
      const hosted = await mirrorListingPhotoUrl(photo, sellerId);
      return hosted ?? photo;
    })
  );
}
