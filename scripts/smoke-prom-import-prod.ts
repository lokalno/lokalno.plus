/**
 * Production smoke: Prom import + re-import confirmation (backend).
 * Does NOT deploy. Uses PRODUCTION_DATABASE_URL_UNPOOLED only.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { runPromImportBatch } from "../src/lib/prom-import-service";
import { parsePhotos } from "../src/lib/utils";
import { PromReimportConfirmationRequired } from "../src/lib/prom-import-session";

const FIXTURE = join(__dirname, "fixtures", "smoke-prom-import-one.xlsx");

async function main() {
  const url = process.env.PRODUCTION_DATABASE_URL_UNPOOLED?.trim();
  if (!url) throw new Error("Set PRODUCTION_DATABASE_URL_UNPOOLED");

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const sample = await prisma.listing.findFirst({
      where: { photos: { contains: "images.prom.ua" } },
      select: { photos: true, sellerId: true, seller: { select: { city: true } } },
    });
    if (!sample) throw new Error("No Prom listing sample for photo URL");

    const photos = parsePhotos(sample.photos);
    const photoUrl = photos[0];
    if (!photoUrl) throw new Error("Sample listing has no photo");

    const workbook = XLSX.read(readFileSync(FIXTURE));
    const sheet = workbook.Sheets["Export Products Sheet"];
    if (!sheet) throw new Error("Fixture sheet missing");
    const row = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)[0];
    if (!row) throw new Error("Fixture row missing");
    row["Посилання_зображення"] = photoUrl;

    const patched = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const buffer = patched.buffer.slice(
      patched.byteOffset,
      patched.byteOffset + patched.byteLength
    ) as ArrayBuffer;

    const beforePending = await prisma.listing.count({ where: { status: "PENDING" } });

    const first = await runPromImportBatch({
      buffer,
      sellerId: sample.sellerId,
      city: sample.seller.city ?? "Київ",
      fileName: "smoke-prom-import-one.xlsx",
    });

    let confirmBlocked = false;
    try {
      await runPromImportBatch({
        buffer,
        sellerId: sample.sellerId,
        city: sample.seller.city ?? "Київ",
        fileName: "smoke-prom-import-one.xlsx",
      });
    } catch (error) {
      confirmBlocked = error instanceof PromReimportConfirmationRequired;
    }

    const second = await runPromImportBatch({
      buffer,
      sellerId: sample.sellerId,
      city: sample.seller.city ?? "Київ",
      fileName: "smoke-prom-import-one.xlsx",
      confirmReimport: true,
    });

    const afterPending = await prisma.listing.count({ where: { status: "PENDING" } });

    console.log(
      JSON.stringify(
        {
          firstImport: {
            created: first.created,
            updated: first.updated,
            errors: first.errors,
            sessionStatus: first.session.status,
          },
          reimportWithoutConfirmBlocked: confirmBlocked,
          reimportWithConfirm: {
            created: second.created,
            updated: second.updated,
            errors: second.errors,
          },
          pendingCount: { before: beforePending, after: afterPending, delta: afterPending - beforePending },
        },
        null,
        2
      )
    );

    const pass =
      first.created === 1 &&
      first.errors === 0 &&
      confirmBlocked &&
      second.created === 0 &&
      second.updated === 1 &&
      afterPending - beforePending <= 1;

    if (!pass) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
