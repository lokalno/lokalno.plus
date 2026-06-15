-- Rollback Prom import dedup schema (does NOT delete Listing rows)

DROP TABLE IF EXISTS "PromImportSession";

DROP INDEX IF EXISTS "Listing_sellerId_promImportKey_key";

ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promImportKey";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promUniqueId";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promProductId";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promSku";
