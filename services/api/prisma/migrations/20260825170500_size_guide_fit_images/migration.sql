-- Add fit-specific image-driven size guides.
ALTER TABLE "SizeGuide" ADD COLUMN IF NOT EXISTS "fitType" TEXT NOT NULL DEFAULT 'oversized';
ALTER TABLE "SizeGuide" ADD COLUMN IF NOT EXISTS "chartImageUrl" TEXT;
ALTER TABLE "SizeGuide" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- Existing rows were the oversized/default guide before fit types existed.
UPDATE "SizeGuide" SET "fitType" = 'oversized' WHERE "fitType" IS NULL OR "fitType" = '';

DROP INDEX IF EXISTS "SizeGuide_size_key";
CREATE UNIQUE INDEX IF NOT EXISTS "SizeGuide_fitType_size_key" ON "SizeGuide"("fitType", "size");
CREATE INDEX IF NOT EXISTS "SizeGuide_fitType_idx" ON "SizeGuide"("fitType");
