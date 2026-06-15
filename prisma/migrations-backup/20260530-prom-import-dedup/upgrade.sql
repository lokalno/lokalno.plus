-- Prom import dedup: ADDITIVE ONLY (no deletes, no data loss on existing listings)
-- Apply when schema.prisma is updated to match.

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promImportKey" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promUniqueId" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promProductId" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "promSku" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Listing_sellerId_promImportKey_key"
  ON "Listing"("sellerId", "promImportKey")
  WHERE "promImportKey" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "PromImportSession" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "fileHash" TEXT NOT NULL,
  "fileName" TEXT,
  "totalRows" INTEGER NOT NULL,
  "nextOffset" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromImportSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromImportSession_sellerId_fileHash_key"
  ON "PromImportSession"("sellerId", "fileHash");

CREATE INDEX IF NOT EXISTS "PromImportSession_sellerId_status_idx"
  ON "PromImportSession"("sellerId", "status");

ALTER TABLE "PromImportSession"
  ADD CONSTRAINT "PromImportSession_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
