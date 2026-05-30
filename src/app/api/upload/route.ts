import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 900_000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб завантажити фото" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не обрано" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Дозволені лише зображення" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Максимум 8 МБ" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Фото занадто велике після стиснення. Спробуйте менше зображення." },
        { status: 400 }
      );
    }

    const contentType = file.type === "image/gif" ? "image/gif" : file.type || "image/jpeg";
    const ext = contentType === "image/png" ? "png" : contentType === "image/gif" ? "gif" : "jpg";
    const filename = `${randomUUID()}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${session.user.id}/${filename}`, buffer, {
        access: "public",
        contentType,
      });
      return NextResponse.json({ url: blob.url });
    }

    if (!process.env.VERCEL) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      return NextResponse.json({ url: `/uploads/${filename}` });
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;
    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Помилка завантаження";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
