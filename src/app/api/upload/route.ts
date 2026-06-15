import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { UPLOAD_MAX_BYTES, MAX_LISTING_VIDEO_BYTES } from "@/lib/constants";
import { isAllowedListingVideoMime } from "@/lib/listing-media";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = UPLOAD_MAX_BYTES;
const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function detectMediaKind(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const ext = fileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  return null;
}

function extensionForUpload(contentType: string, isVideo: boolean): string {
  if (isVideo) {
    if (contentType === "video/webm") return "webm";
    if (contentType === "video/quicktime") return "mov";
    return "mp4";
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function dataUrlFromBuffer(buffer: Buffer, contentType: string) {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function saveToLocalPublic(folder: string, filename: string, buffer: Buffer) {
  const uploadDir = path.join(process.cwd(), "public", folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/${folder}/${filename}`;
}

async function uploadToBlob(folder: string, userId: string, filename: string, buffer: Buffer, contentType: string) {
  const blob = await put(`${folder}/${userId}/${filename}`, buffer, {
    access: "public",
    contentType,
  });
  return blob.url;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб завантажити файл" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не обрано" }, { status: 400 });
    }

    const kind = detectMediaKind(file);
    if (!kind) {
      return NextResponse.json({ error: "Дозволені лише фото (JPG, PNG, WEBP) або відео (MP4, MOV)" }, { status: 400 });
    }

    const isVideo = kind === "video";
    const isImage = kind === "image";

    if (isVideo && file.type && !isAllowedListingVideoMime(file.type)) {
      return NextResponse.json({ error: "Дозволені формати відео: MP4, WebM, MOV" }, { status: 400 });
    }

    const maxIncoming = isVideo ? MAX_LISTING_VIDEO_BYTES : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxIncoming) {
      return NextResponse.json(
        {
          error: isVideo
            ? `Відео занадто велике. Максимум ${Math.round(MAX_LISTING_VIDEO_BYTES / (1024 * 1024))} МБ`
            : "Максимум 8 МБ до стиснення для фото",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const maxStored = isVideo ? MAX_LISTING_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (buffer.length > maxStored) {
      return NextResponse.json(
        {
          error: isVideo
            ? `Відео занадто велике (${Math.round(buffer.length / (1024 * 1024))} МБ). Спробуйте коротше відео.`
            : `Фото занадто велике (${Math.round(buffer.length / 1024)} KB). Спробуйте менше зображення.`,
        },
        { status: 400 }
      );
    }

    const contentType =
      file.type ||
      (isVideo ? "video/mp4" : fileExtension(file.name) === "png" ? "image/png" : "image/jpeg");
    const ext = extensionForUpload(contentType, isVideo);
    const filename = `${randomUUID()}.${ext}`;
    const folder = isVideo ? "videos" : "uploads";

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const url = await uploadToBlob(folder, session.user.id, filename, buffer, contentType);
        return NextResponse.json({ url, kind: isVideo ? "video" : "image" });
      } catch (err) {
        console.error("Vercel Blob upload failed:", err);
        if (isVideo) {
          return NextResponse.json(
            {
              error:
                "Не вдалося завантажити відео. Спробуйте ще раз або напишіть у підтримку.",
            },
            { status: 503 }
          );
        }
        // Fall through to inline image fallback below.
      }
    }

    if (!process.env.VERCEL) {
      const url = await saveToLocalPublic(folder, filename, buffer);
      return NextResponse.json({ url, kind: isVideo ? "video" : "image" });
    }

    if (isImage) {
      return NextResponse.json({
        url: dataUrlFromBuffer(buffer, contentType),
        kind: "image",
        fallback: true,
      });
    }

    return NextResponse.json(
      {
        error:
          "Завантаження відео тимчасово недоступне. Спробуйте додати фото або напишіть у підтримку.",
      },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Помилка завантаження";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
