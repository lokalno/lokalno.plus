-- ETAP 2: READ-ONLY estimates (run manually on staging/replica before backfill)
-- DO NOT run on production until explicitly approved.

-- A. Total listings
SELECT 'total_listings' AS metric, COUNT(*)::bigint AS value FROM "Listing";

-- B. Pending queue (reference from admin UI)
SELECT 'pending_listings' AS metric, COUNT(*)::bigint AS value
FROM "Listing"
WHERE status = 'PENDING';

-- C. Legacy Prom import candidates (promSku backfill target)
SELECT 'backfill_promSku_candidates' AS metric, COUNT(*)::bigint AS value
FROM "Listing"
WHERE "promSku" IS NULL
  AND "itemLocation" IS NOT NULL
  AND trim("itemLocation") <> ''
  AND trim("itemLocation") <> 'Prom'
  AND photos LIKE '%images.prom.ua%';

-- D. Already have promSku (skip step 1)
SELECT 'already_has_promSku' AS metric, COUNT(*)::bigint AS value
FROM "Listing"
WHERE "promSku" IS NOT NULL;

-- E. Already have promImportKey
SELECT 'already_has_promImportKey' AS metric, COUNT(*)::bigint AS value
FROM "Listing"
WHERE "promImportKey" IS NOT NULL;

-- F. Unique seller+SKU groups among candidates (promImportKey backfill scope)
SELECT 'unique_seller_sku_groups' AS metric, COUNT(*)::bigint AS value
FROM (
  SELECT "sellerId", lower(trim("itemLocation")) AS sku_key
  FROM "Listing"
  WHERE "promSku" IS NULL
    AND "itemLocation" IS NOT NULL
    AND trim("itemLocation") <> ''
    AND trim("itemLocation") <> 'Prom'
    AND photos LIKE '%images.prom.ua%'
  GROUP BY "sellerId", lower(trim("itemLocation"))
) groups;

-- G. Duplicate legacy rows per seller+SKU (second copies that must NOT get promImportKey)
SELECT 'duplicate_legacy_rows_same_sku' AS metric, COUNT(*)::bigint AS value
FROM (
  SELECT "sellerId", lower(trim("itemLocation")) AS sku_key, COUNT(*) AS cnt
  FROM "Listing"
  WHERE "promSku" IS NULL
    AND "itemLocation" IS NOT NULL
    AND trim("itemLocation") <> ''
    AND trim("itemLocation") <> 'Prom'
    AND photos LIKE '%images.prom.ua%'
  GROUP BY "sellerId", lower(trim("itemLocation"))
  HAVING COUNT(*) > 1
) dup_groups;

-- H. Rows in duplicate groups (extra copies beyond oldest)
SELECT 'duplicate_legacy_extra_rows' AS metric, COALESCE(SUM(cnt - 1), 0)::bigint AS value
FROM (
  SELECT COUNT(*) AS cnt
  FROM "Listing"
  WHERE "promSku" IS NULL
    AND "itemLocation" IS NOT NULL
    AND trim("itemLocation") <> ''
    AND trim("itemLocation") <> 'Prom'
    AND photos LIKE '%images.prom.ua%'
  GROUP BY "sellerId", lower(trim("itemLocation"))
  HAVING COUNT(*) > 1
) dup_groups;

-- I. Breakdown by status (candidates)
SELECT status, COUNT(*)::bigint AS candidates
FROM "Listing"
WHERE "promSku" IS NULL
  AND "itemLocation" IS NOT NULL
  AND trim("itemLocation") <> ''
  AND trim("itemLocation") <> 'Prom'
  AND photos LIKE '%images.prom.ua%'
GROUP BY status
ORDER BY candidates DESC;
