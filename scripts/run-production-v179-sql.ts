/**
 * Production SQL steps 0–5 (main branch only).
 *
 *   $env:PRODUCTION_DATABASE_URL_UNPOOLED="postgresql://..."
 *   $env:NEON_API_KEY="..."            # optional, for backup branch
 *   $env:NEON_PROJECT_ID="..."         # optional, for backup branch
 *   npx tsx scripts/run-production-v179-sql.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const ROOT = join(__dirname, "..");
const MIGRATIONS = join(ROOT, "prisma", "migrations-backup");
const BACKUP_BRANCH_NAME = `backup-v179-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

const STAGING_ESTIMATE = {
  total_listings: 521,
  pending_listings: 505,
  backfill_promSku_candidates: 234,
  already_has_promSku: 0,
  already_has_promImportKey: 0,
  unique_seller_sku_groups: 186,
  duplicate_legacy_rows_same_sku: 47,
  duplicate_legacy_extra_rows: 48,
} as const;

type Row = Record<string, unknown>;
type EstimateMap = Record<string, number>;

function readSql(relativePath: string): string {
  return readFileSync(join(MIGRATIONS, relativePath), "utf8");
}

function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

function splitSqlStatements(sql: string): string[] {
  return stripSqlComments(sql)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function serializeRows(rows: Row[]): Row[] {
  return rows.map((row) => {
    const out: Row = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = typeof value === "bigint" ? value.toString() : value;
    }
    return out;
  });
}

function createPrisma(connectionUri: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: connectionUri } },
  });
}

async function neonCreateBackupBranch(): Promise<string> {
  const apiKey = process.env.NEON_API_KEY?.trim();
  const projectId = process.env.NEON_PROJECT_ID?.trim();
  if (!apiKey || !projectId) {
    return "SKIPPED (set NEON_API_KEY + NEON_PROJECT_ID to auto-create backup branch)";
  }

  const createRes = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: { name: BACKUP_BRANCH_NAME },
        endpoints: [{ type: "read_write" }],
      }),
    }
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Backup branch create failed (${createRes.status}): ${text}`);
  }

  const created = (await createRes.json()) as { branch: { id: string; name: string } };
  return created.branch.name;
}

async function runSelectQueries(prisma: PrismaClient, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  const parts = splitSqlStatements(sql);
  const allRows: Row[] = [];
  for (const part of parts) {
    const rows = serializeRows((await prisma.$queryRawUnsafe(part)) as Row[]);
    console.log(JSON.stringify(rows, null, 2));
    allRows.push(...rows);
  }
  return allRows;
}

async function runSqlFile(prisma: PrismaClient, label: string, relativePath: string) {
  const statements = splitSqlStatements(readSql(relativePath));
  console.log(`\n=== ${label} ===`);
  console.log(`file: ${relativePath}`);
  console.log(`statements: ${statements.length}`);

  const hasTransaction = statements[0]?.toUpperCase() === "BEGIN";
  if (hasTransaction) {
    await prisma.$transaction(async (tx) => {
      for (const statement of statements) {
        await tx.$executeRawUnsafe(statement);
      }
    });
  } else {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
  console.log("OK");
}

function parseEstimateRows(rows: Row[]): EstimateMap {
  const map: EstimateMap = {};
  for (const row of rows) {
    if (typeof row.metric === "string" && row.value != null) {
      map[row.metric] = Number(row.value);
    }
  }
  return map;
}

function assertEstimateMatchesStaging(estimate: EstimateMap): string | null {
  if (estimate.already_has_promSku !== STAGING_ESTIMATE.already_has_promSku) {
    return `already_has_promSku=${estimate.already_has_promSku} (expected 0 — DB may already be migrated)`;
  }
  if (estimate.already_has_promImportKey !== STAGING_ESTIMATE.already_has_promImportKey) {
    return `already_has_promImportKey=${estimate.already_has_promImportKey} (expected 0)`;
  }

  const etap3Columns = estimate as EstimateMap & { promColor?: number };
  const keys = Object.keys(STAGING_ESTIMATE) as (keyof typeof STAGING_ESTIMATE)[];
  for (const key of keys) {
    const actual = estimate[key];
    const expected = STAGING_ESTIMATE[key];
    if (actual === undefined) continue;
    const delta = Math.abs(actual - expected);
    const tolerance = key === "total_listings" || key === "pending_listings" ? 5 : 0;
    if (delta > tolerance) {
      return `${key}=${actual} (staging=${expected}, tolerance=${tolerance})`;
    }
  }
  return null;
}

function evaluateVerify(verifyRows: Row[]): { pass: boolean; details: Row[] } {
  const duplicateKeyRows = verifyRows.filter(
    (row) => row.sellerId !== undefined && row.promImportKey !== undefined
  );
  const stillMissing = verifyRows.find((row) => row.still_missing_promsku !== undefined);
  const legacyDup = verifyRows.find((row) => row.duplicate_rows_without_promimportkey !== undefined);

  const stillMissingVal = Number(stillMissing?.still_missing_promsku ?? NaN);
  const legacyDupVal = Number(legacyDup?.duplicate_rows_without_promimportkey ?? NaN);

  const pass =
    duplicateKeyRows.length === 0 &&
    stillMissingVal === 0 &&
    legacyDupVal === STAGING_ESTIMATE.duplicate_legacy_extra_rows;

  return {
    pass,
    details: [
      { check: "duplicate_promImportKey_rows", value: duplicateKeyRows.length, expected: 0 },
      { check: "still_missing_promSku", value: stillMissingVal, expected: 0 },
      {
        check: "duplicate_rows_without_promImportKey",
        value: legacyDupVal,
        expected: STAGING_ESTIMATE.duplicate_legacy_extra_rows,
      },
    ],
  };
}

async function main() {
  const connectionUri = process.env.PRODUCTION_DATABASE_URL_UNPOOLED?.trim();
  if (!connectionUri) {
    throw new Error("Set PRODUCTION_DATABASE_URL_UNPOOLED (main branch, unpooled).");
  }

  console.log("=== STEP 0: Backup branch ===");
  const backupBranch = await neonCreateBackupBranch();
  console.log(`Backup branch: ${backupBranch}`);

  console.log(`\nTarget: production main`);
  console.log(`Host: ${connectionUri.replace(/:[^:@/]+@/, ":***@")}`);

  const prisma = createPrisma(connectionUri);
  const report: Row = {
    step0_backupBranch: backupBranch,
    estimate: null,
    etap3: null,
    etap2: null,
    verify: null,
    deployDecision: "NO-GO",
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("Connected.");

    const preColumns = serializeRows(
      (await prisma.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Listing'
          AND column_name IN ('promColor','promSize','promVariantGroupId','promCharacteristics')
        ORDER BY column_name;
      `)) as Row[]
    );
    if (preColumns.length > 0) {
      throw new Error(
        `STOP: ETAP 3 columns already exist (${preColumns.map((r) => r.column_name).join(", ")}). Wrong DB or already migrated.`
      );
    }

    const estimateRows = await runSelectQueries(
      prisma,
      "STEP 1: estimate.sql",
      readSql("20260610-prom-fields-backfill/estimate.sql")
    );
    const estimate = parseEstimateRows(estimateRows);
    report.estimate = estimate;

    const estimateError = assertEstimateMatchesStaging(estimate);
    if (estimateError) {
      throw new Error(`STOP: estimate differs from staging — ${estimateError}`);
    }
    console.log("\nEstimate gate: PASS (matches staging within tolerance)");

    console.log("\n=== STEP 2: Row-level backup table ===");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ListingPromBackfillBackup20260610" AS
      SELECT
        id, "sellerId", "itemLocation", "promImportKey",
        "promUniqueId", "promProductId", "promSku",
        photos, status, "createdAt", now() AS backed_up_at
      FROM "Listing"
      WHERE "promSku" IS NULL
        AND "itemLocation" IS NOT NULL
        AND trim("itemLocation") <> ''
        AND trim("itemLocation") <> 'Prom'
        AND photos LIKE '%images.prom.ua%';
    `);
    const backupCount = serializeRows(
      (await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::bigint AS rows FROM "ListingPromBackfillBackup20260610";`
      )) as Row[]
    );
    console.log(JSON.stringify(backupCount, null, 2));
    console.log("OK");

    await runSqlFile(prisma, "STEP 3: ETAP 3 upgrade.sql", "20260610-prom-attributes/upgrade.sql");
    const etap3 = serializeRows(
      (await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'Listing'
          AND column_name IN ('promColor','promSize','promVariantGroupId','promCharacteristics')
        ORDER BY column_name;
      `)) as Row[]
    );
    console.log("\n=== ETAP 3 column types ===");
    console.log(JSON.stringify(etap3, null, 2));
    report.etap3 = etap3;

    await runSqlFile(
      prisma,
      "STEP 4: ETAP 2 backfill upgrade.sql",
      "20260610-prom-fields-backfill/upgrade.sql"
    );
    report.etap2 = { status: "OK" };

    const verifyRows = await runSelectQueries(
      prisma,
      "STEP 5: verify.sql",
      readSql("20260610-prom-fields-backfill/verify.sql")
    );
    const verifyEval = evaluateVerify(verifyRows);
    report.verify = verifyEval.details;
    console.log("\n=== VERIFY evaluation ===");
    console.log(JSON.stringify(verifyEval, null, 2));

    if (!verifyEval.pass) {
      throw new Error("STOP: verify.sql did not PASS");
    }

    report.deployDecision = "GO";
    console.log("\n=== FINAL DEPLOY DECISION: GO ===");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.deployDecision = "NO-GO";
    console.error("\n=== FINAL DEPLOY DECISION: NO-GO ===");
    console.error(error instanceof Error ? error.message : error);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
