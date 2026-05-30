import sharp from "sharp";

const MAX_OUTPUT_BYTES = 900_000;

export async function processUploadImage(input: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  let image = sharp(input).rotate();
  const meta = await image.metadata();

  if ((meta.width || 0) > 1600 || (meta.height || 0) > 1600) {
    image = image.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
  }

  let quality = 85;
  let buffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();

  while (buffer.length > MAX_OUTPUT_BYTES && quality > 45) {
    quality -= 10;
    buffer = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  if (buffer.length > MAX_OUTPUT_BYTES) {
    throw new Error("Зображення занадто велике. Спробуйте менший файл.");
  }

  return { buffer, contentType: "image/jpeg" };
}
