-- ETAP 3 ROLLBACK: drop new Prom attribute columns only
-- Existing listing rows remain. promImportKey/promSku from v177 unchanged.

DROP INDEX IF EXISTS "Listing_sellerId_promVariantGroupId_idx";
DROP INDEX IF EXISTS "Listing_sellerId_promSku_idx";

ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promCharacteristics";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promVariantGroupId";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promSize";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "promColor";
