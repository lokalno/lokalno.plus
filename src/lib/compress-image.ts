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

  if (!file.type.startsWith("image/")) {
    throw new Error("Дозволені лише зображення (JPG, PNG, WEBP)");
  }

  if (file.type === "image/gif") {
    if (file.size > maxBytes) {
      throw new Error("GIF занадто великий. Спробуйте JPG або PNG.");
    }
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  try {
    let width = Math.min(bitmap.width, maxWidth);
    let quality = 0.82;

    for (let attempt = 0; attempt < 12; attempt++) {
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

      if (quality > 0.45) {
        quality -= 0.08;
      } else {
        width = Math.round(width * 0.85);
        if (width < 480) break;
      }
    }

    throw new Error("Фото занадто велике. Спробуйте інше зображення або менший розмір.");
  } finally {
    bitmap.close();
  }
}
