-- ETAP 2: post-backfill verification (read-only)

-- 1. No duplicate promImportKey per seller (should return 0 rows)
SELECT "sellerId", "promImportKey", COUNT(*) AS cnt
FROM "Listing"
WHERE "promImportKey" IS NOT NULL
GROUP BY "sellerId", "promImportKey"
HAVING COUNT(*) > 1;

-- 2. Legacy candidates still missing promSku (should be 0 or explainable)
SELECT COUNT(*) AS still_missing_promSku
FROM "Listing"
WHERE "promSku" IS NULL
  AND "itemLocation" IS NOT NULL
  AND trim("itemLocation") <> ''
  AND trim("itemLocation") <> 'Prom'
  AND photos LIKE '%images.prom.ua%';

-- 3. Oldest-per-SKU has key; duplicates may still lack promImportKey (expected)
SELECT COUNT(*) AS duplicate_rows_without_promImportKey
FROM "Listing" l
WHERE l."promImportKey" IS NULL
  AND l."promSku" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Listing" l2
    WHERE l2."sellerId" = l."sellerId"
      AND lower(trim(l2."promSku")) = lower(trim(l."promSku"))
      AND l2."promImportKey" IS NOT NULL
      AND l2.id <> l.id
  );

-- 4. Status unchanged check (compare with backup table if available)
-- SELECT b.status AS before_status, l.status AS after_status, COUNT(*)
-- FROM "ListingPromBackfillBackup20260610" b
-- JOIN "Listing" l ON l.id = b.id
-- WHERE b.status <> l.status
-- GROUP BY 1, 2;
