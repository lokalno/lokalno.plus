import { MAX_LISTING_VIDEO_BYTES } from "./constants";
import { isAllowedListingVideoMime } from "./listing-media";
import { compressImageFile, type CompressImageOptions } from "./compress-image";

function isLocalDevHost(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  );
}

function isUsableUploadUrl(url: string): boolean {
  if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("data:")) {
    return true;
  }
  if (isLocalDevHost() && (url.startsWith("/uploads/") || url.startsWith("/videos/"))) {
    return true;
  }
  return false;
}

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Не вдалося прочитати фото"));
    };
    reader.onerror = () => reject(new Error("Не вдалося прочитати фото"));
    reader.readAsDataURL(file);
  });
}

/** Compress, upload to blob when possible, otherwise embed as compressed data URL. */
export async function uploadPhotoFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const compressed = await compressImageFile(file, options);

  try {
    const formData = new FormData();
    formData.append("file", compressed);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const data = await res.json();

    if (res.ok && typeof data.url === "string" && isUsableUploadUrl(data.url)) {
      return data.url;
    }

    if (!res.ok && typeof data.error === "string") {
      throw new Error(data.error);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити фото";
    if (!isLocalDevHost()) {
      // Server-side may already return data URLs; if not, compress locally as last resort.
      const dataUrl = await readFileAsDataUrl(compressed);
      const maxDataUrlLen = Math.round((options.maxBytes ?? 350_000) * 1.5);
      if (dataUrl.length <= maxDataUrlLen) {
        return dataUrl;
      }
      throw new Error(message);
    }
  }

  const dataUrl = await readFileAsDataUrl(compressed);
  const maxDataUrlLen = Math.round((options.maxBytes ?? 350_000) * 1.5);
  if (dataUrl.length > maxDataUrlLen) {
    throw new Error("Фото занадто велике. Спробуйте менше зображення.");
  }
  return dataUrl;
}

async function uploadFileToServer(file: File, kind: "фото" | "відео"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const data = await res.json();

  if (res.ok && typeof data.url === "string" && isUsableUploadUrl(data.url)) {
    return data.url;
  }

  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Не вдалося завантажити ${kind}`);
  }

  throw new Error(`Не вдалося завантажити ${kind}`);
}

/** Upload listing video to blob storage (production) or local /uploads (dev). */
export async function uploadVideoFile(file: File): Promise<string> {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    throw new Error("Дозволені формати відео: MP4, WebM, MOV");
  }

  if (file.type && !isAllowedListingVideoMime(file.type) && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    throw new Error("Дозволені формати відео: MP4, WebM, MOV");
  }

  if (file.size > MAX_LISTING_VIDEO_BYTES) {
    throw new Error(
      `Відео занадто велике. Максимум ${Math.round(MAX_LISTING_VIDEO_BYTES / (1024 * 1024))} МБ`
    );
  }

  return uploadFileToServer(file, "відео");
}

/** Upload listing photo (compressed) or video. */
export async function uploadListingMediaFile(
  file: File,
  photoOptions: CompressImageOptions = {}
): Promise<string> {
  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    return uploadVideoFile(file);
  }
  return uploadPhotoFile(file, photoOptions);
}
