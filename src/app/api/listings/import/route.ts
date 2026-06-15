import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/user-check";
import {
  PROM_IMPORT_BATCH_SIZE,
  PROM_IMPORT_MAX_FILE_BYTES,
} from "@/lib/prom-import";
import { runPromImportBatch } from "@/lib/prom-import-service";
import { PromReimportConfirmationRequired } from "@/lib/prom-import-session";

export const maxDuration = 60;

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function isAllowedImportFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const banCheck = await assertNotBanned(session.user.id);
  if (!banCheck.ok) {
    return NextResponse.json({ error: banCheck.error }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const forceRestart = formData.get("forceRestart") === "true";
    const confirmReimport = formData.get("confirmReimport") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Оберіть файл Excel або CSV з Prom.ua" }, { status: 400 });
    }

    if (!isAllowedImportFile(file.name)) {
      return NextResponse.json(
        { error: "Підтримуються лише файли .xlsx, .xls або .csv" },
        { status: 400 }
      );
    }

    if (file.size > PROM_IMPORT_MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Файл занадто великий (максимум 4 МБ). Розділіть експорт на частини." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { city: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }

    const buffer = await file.arrayBuffer();
    let result;
    try {
      result = await runPromImportBatch({
        buffer,
        sellerId: session.user.id,
        city: user.city ?? "",
        fileName: file.name,
        forceRestart,
        confirmReimport,
      });
    } catch (error) {
      if (error instanceof PromReimportConfirmationRequired) {
        return NextResponse.json(
          {
            error:
              "Цей файл уже повністю імпортовано. Повторний імпорт оновить існуючі оголошення за Prom ID.",
            requiresReimportConfirmation: true,
            session: error.session,
          },
          { status: 409 }
        );
      }
      throw error;
    }

    if (result.totalInFile === 0) {
      return NextResponse.json(
        {
          error:
            "У файлі не знайдено товарів. Перевірте, що це експорт Prom.ua (вкладка Export Products Sheet).",
        },
        { status: 400 }
      );
    }

    if (result.batchSize === 0 && result.hasMore) {
      return NextResponse.json(
        {
          error: `У файлі ${result.totalInFile} товарів, але поточний offset за межами файлу.`,
          session: result.session,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...result,
      limitPerBatch: PROM_IMPORT_BATCH_SIZE,
    });
  } catch {
    return NextResponse.json({ error: "Помилка імпорту. Перевірте формат файлу." }, { status: 500 });
  }
}
