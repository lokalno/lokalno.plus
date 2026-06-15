/**
 * Staging-only runner: Neon branch + pre-check + ETAP 3 + ETAP 2 + verify.
 *
 * Usage (pick one):
 *   A) Auto-create branch:
 *      $env:NEON_API_KEY="..."
 *      $env:NEON_PROJECT_ID="..."
 *      npx tsx scripts/run-staging-v179-sql.ts
 *
 *   B) Existing staging branch:
 *      $env:STAGING_DATABASE_URL_UNPOOLED="postgresql://..."
 *      npx tsx scripts/run-staging-v179-sql.ts --skip-branch-create
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const ROOT = join(__dirname, "..");
const MIGRATIONS = join(ROOT, "prisma", "migrations-backup");
const BRANCH_NAME = `staging-v179-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

type Row = Record<string, unknown>;

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

async function neonCreateBranch(): Promise<{ branchName: string; connectionUri: string }> {
  const apiKey = process.env.NEON_API_KEY?.trim();
  const projectId = process.env.NEON_PROJECT_ID?.trim();
  if (!apiKey || !projectId) {
    throw new Error("NEON_API_KEY and NEON_PROJECT_ID are required to create a branch.");
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
        branch: { name: BRANCH_NAME },
        endpoints: [{ type: "read_write" }],
      }),
    }
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Neon branch create failed (${createRes.status}): ${text}`);
  }

  const created = (await createRes.json()) as {
    branch: { id: string; name: string };
    connection_uris?: { connection_uri?: string }[];
  };

  const branchId = created.branch.id;
  let connectionUri = created.connection_uris?.[0]?.connection_uri;

  if (!connectionUri) {
    const uriRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/connection_uri?branch_id=${branchId}&database_name=neondb&role_name=neondb_owner&pooled=false`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );
    if (!uriRes.ok) {
      const text = await uriRes.text();
      throw new Error(`Neon connection_uri failed (${uriRes.status}): ${text}`);
    }
    const uriJson = (await uriRes.json()) as { uri?: string };
    connectionUri = uriJson.uri;
  }

  if (!connectionUri) {
    throw new Error("Neon branch created but connection URI was not returned.");
  }

  return { branchName: created.branch.name, connectionUri };
}

function createPrisma(connectionUri: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: connectionUri } },
  });
}

function splitSqlStatements(sql: string): string[] {
  return stripSqlComments(sql)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
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

function serializeRows(rows: Row[]): Row[] {
  return rows.map((row) => {
    const out: Row = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = typeof value === "bigint" ? value.toString() : value;
    }
    return out;
  });
}

async function runSelectQueries(prisma: PrismaClient, label: string, sql: string) {
  console.log(`\n=== ${label} ===`);
  const parts = stripSqlComments(sql)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const results: Row[] = [];
  for (const part of parts) {
    const rows = serializeRows((await prisma.$queryRawUnsafe(part)) as Row[]);
    console.log(JSON.stringify(rows, null, 2));
    results.push({ query: part.slice(0, 80), rows });
  }
  return results;
}

const PRECHECK_SQL = `
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Listing'
  AND column_name IN (
    'promImportKey','promSku','promUniqueId','promProductId',
    'promColor','promSize','promVariantGroupId','promCharacteristics'
  )
ORDER BY column_name;

SELECT to_regclass('"PromImportSession"')::text AS prom_import_session_table;
`;

async function main() {
  const skipBranchCreate = process.argv.includes("--skip-branch-create");
  let branchName = process.env.STAGING_BRANCH_NAME ?? "existing";
  let connectionUri = process.env.STAGING_DATABASE_URL_UNPOOLED?.trim() ?? "";

  if (!skipBranchCreate) {
    const branch = await neonCreateBranch();
    branchName = branch.branchName;
    connectionUri = branch.connectionUri;
    console.log(`Created Neon branch: ${branchName}`);
  }

  if (!connectionUri) {
    throw new Error(
      "No database URL. Set NEON_API_KEY+NEON_PROJECT_ID or STAGING_DATABASE_URL_UNPOOLED."
    );
  }

  console.log(`Target branch: ${branchName}`);
  console.log(`Host: ${connectionUri.replace(/:[^:@/]+@/, ":***@")}`);

  const prisma = createPrisma(connectionUri);
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("Connected.");

    await runSelectQueries(prisma, "PRE-CHECK (schema snapshot)", PRECHECK_SQL);
    await runSelectQueries(
      prisma,
      "PRE-CHECK (estimate.sql)",
      readSql("20260610-prom-fields-backfill/estimate.sql")
    );

    await runSqlFile(
      prisma,
      "ETAP 3 upgrade.sql",
      "20260610-prom-attributes/upgrade.sql"
    );

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
    console.log("\n=== Row-level backup table ===\nOK");

    await runSqlFile(
      prisma,
      "ETAP 2 backfill upgrade.sql",
      "20260610-prom-fields-backfill/upgrade.sql"
    );

    const verify = await runSelectQueries(
      prisma,
      "VERIFY (verify.sql)",
      readSql("20260610-prom-fields-backfill/verify.sql")
    );

    const etap3Check = serializeRows(
      (await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Listing'
        AND column_name IN ('promColor','promSize','promVariantGroupId','promCharacteristics')
      ORDER BY column_name;
    `)) as Row[]
    );
    console.log("\n=== ETAP 3 column types ===");
    console.log(JSON.stringify(etap3Check, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log(
      JSON.stringify(
        {
          branchName,
          verifyQueries: verify.length,
          completedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
