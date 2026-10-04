-- A short audio clip per product theme, played on the homepage hero.
--
-- Additive only: two nullable columns, so the running API is unaffected until the
-- code that reads them ships.

ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "songUrl" TEXT;
ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "songTitle" TEXT;
