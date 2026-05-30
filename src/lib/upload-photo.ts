import { compressImageFile, type CompressImageOptions } from "./compress-image";

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

/** Compress, upload to server when possible, otherwise embed as data URL. */
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
    if (res.ok && typeof data.url === "string") {
      const isLocalUpload = data.url.startsWith("/uploads/");
      const onLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      if (!isLocalUpload || onLocalhost) {
        return data.url;
      }
    }
  } catch {
    // Fall back to inline data URL below.
  }

  const dataUrl = await readFileAsDataUrl(compressed);
  if (dataUrl.length > 280_000) {
    throw new Error("Фото занадто велике. Спробуйте менше зображення.");
  }
  return dataUrl;
}
