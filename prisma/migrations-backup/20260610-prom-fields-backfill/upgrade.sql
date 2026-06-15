-- ETAP 2: Prom fields BACKFILL — UPDATE ONLY, NO DELETE
-- Apply ONLY after full DB backup and estimate.sql review.
-- Matches buildPromImportKey() priority in src/lib/prom-import.ts:
--   prom:uid:{promUniqueId} > prom:id:{promProductId} > prom:sku:{lower(promSku)}

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 0 (recommended): row-level backup — see README pre-backfill table
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- STEP 1: promSku <- itemLocation (Prom legacy heuristic)
-- Only rows that look like Prom import and still lack promSku.
-- ---------------------------------------------------------------------------
UPDATE "Listing"
SET
  "promSku" = left(trim("itemLocation"), 25),
  "updatedAt" = now()
WHERE "promSku" IS NULL
  AND "itemLocation" IS NOT NULL
  AND trim("itemLocation") <> ''
  AND trim("itemLocation") <> 'Prom'
  AND photos LIKE '%images.prom.ua%';

-- ---------------------------------------------------------------------------
-- STEP 2a: promImportKey from promUniqueId (highest priority, all matching rows)
-- Safe: promUniqueId should be unique per listing when present.
-- ---------------------------------------------------------------------------
UPDATE "Listing"
SET
  "promImportKey" = 'prom:uid:' || "promUniqueId",
  "updatedAt" = now()
WHERE "promImportKey" IS NULL
  AND "promUniqueId" IS NOT NULL
  AND trim("promUniqueId") <> '';

-- ---------------------------------------------------------------------------
-- STEP 2b: promImportKey from promProductId (second priority)
-- ---------------------------------------------------------------------------
UPDATE "Listing"
SET
  "promImportKey" = 'prom:id:' || left("promProductId", 255),
  "updatedAt" = now()
WHERE "promImportKey" IS NULL
  AND "promProductId" IS NOT NULL
  AND trim("promProductId") <> '';

-- ---------------------------------------------------------------------------
-- STEP 2c: promImportKey from promSku — OLDEST ROW ONLY per seller+sku
-- Avoids unique index violation on duplicate legacy pairs (same Kuz - 004 x2).
-- ---------------------------------------------------------------------------
WITH oldest_per_seller_sku AS (
  SELECT DISTINCT ON ("sellerId", lower(trim("promSku")))
    id
  FROM "Listing"
  WHERE "promImportKey" IS NULL
    AND "promSku" IS NOT NULL
    AND trim("promSku") <> ''
  ORDER BY "sellerId", lower(trim("promSku")), "createdAt" ASC
)
UPDATE "Listing" l
SET
  "promImportKey" = 'prom:sku:' || lower(trim(l."promSku")),
  "updatedAt" = now()
FROM oldest_per_seller_sku o
WHERE l.id = o.id;

COMMIT;

-- After commit: run verify.sql
