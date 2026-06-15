-- ETAP 3: Prom attributes — ADDITIVE SCHEMA ONLY
-- Apply on staging first. DO NOT run on production until approved.
-- No DELETE. No data migration in this file (characteristics filled on next re-import).

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promColor" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promSize" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promVariantGroupId" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promCharacteristics" JSONB;

-- If column was already added as TEXT (dev/staging), convert in-place:
-- ALTER TABLE "Listing" ALTER COLUMN "promCharacteristics" TYPE JSONB
--   USING (
--     CASE
--       WHEN "promCharacteristics" IS NULL OR btrim("promCharacteristics") = '' THEN NULL
--       ELSE "promCharacteristics"::jsonb
--     END
--   );

-- Optional read indexes (non-unique, safe for duplicates)
CREATE INDEX IF NOT EXISTS "Listing_sellerId_promVariantGroupId_idx"
  ON "Listing"("sellerId", "promVariantGroupId")
  WHERE "promVariantGroupId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Listing_sellerId_promSku_idx"
  ON "Listing"("sellerId", lower(trim("promSku")))
  WHERE "promSku" IS NOT NULL;
