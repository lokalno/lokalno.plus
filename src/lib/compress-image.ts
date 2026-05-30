const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Дозволені лише зображення (JPG, PNG, WEBP)");
  }

  if (file.type === "image/gif") {
    if (file.size > 900_000) {
      throw new Error("GIF занадто великий. Спробуйте JPG або PNG.");
    }
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Не вдалося обробити фото");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Не вдалося стиснути фото"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
