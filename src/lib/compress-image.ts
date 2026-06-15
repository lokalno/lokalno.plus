export type CompressImageOptions = {
  maxWidth?: number;
  maxBytes?: number;
};

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxBytes = options.maxBytes ?? 350_000;

  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
    throw new Error("Дозволені лише зображення (JPG, PNG, WEBP)");
  }

  if (file.type === "image/gif") {
    if (file.size > maxBytes) {
      throw new Error("GIF занадто великий. Спробуйте JPG або PNG.");
    }
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Формат фото не підтримується. На iPhone: Налаштування → Камера → Формати → «Найсумісніші» або збережіть як JPG."
    );
  }
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  try {
    const sourceMb = file.size / (1024 * 1024);
    let width = Math.min(bitmap.width, maxWidth);
    let quality = sourceMb > 6 ? 0.68 : sourceMb > 3 ? 0.74 : sourceMb > 1 ? 0.8 : 0.85;

    for (let attempt = 0; attempt < 22; attempt++) {
      const height = Math.max(1, Math.round(bitmap.height * (width / bitmap.width)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Не вдалося обробити фото");
      }

      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("Не вдалося стиснути фото"))),
          "image/jpeg",
          quality
        );
      });

      if (blob.size <= maxBytes) {
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      }

      if (quality > 0.32) {
        quality -= 0.07;
      } else if (width > 360) {
        width = Math.round(width * 0.82);
        quality = 0.72;
      } else {
        quality = Math.max(0.22, quality - 0.05);
      }
    }

    throw new Error("Фото занадто велике. Спробуйте інше зображення або менший розмір.");
  } finally {
    bitmap.close();
  }
}
