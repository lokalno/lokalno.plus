-- ETAP 2 ROLLBACK: restore promSku / promImportKey from backup table
-- Requires pre-backfill table ListingPromBackfillBackup20260610 (see README).
-- Does NOT delete listings. Does NOT change status.

BEGIN;

UPDATE "Listing" l
SET
  "promImportKey" = b."promImportKey",
  "promUniqueId" = b."promUniqueId",
  "promProductId" = b."promProductId",
  "promSku" = b."promSku",
  "updatedAt" = now()
FROM "ListingPromBackfillBackup20260610" b
WHERE l.id = b.id;

COMMIT;

-- Optional cleanup after successful rollback verification:
-- DROP TABLE IF EXISTS "ListingPromBackfillBackup20260610";
