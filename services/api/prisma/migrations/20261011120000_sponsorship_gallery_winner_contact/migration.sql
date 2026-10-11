-- Event write-up, end date and photo gallery for the sponsorship details page,
-- and contact details plus the competition won for each prize winner.
--
-- Additive only: nullable columns and an array that defaults to empty, so the
-- running API is unaffected until the code that reads them ships.

ALTER TABLE "Sponsorship" ADD COLUMN IF NOT EXISTS "eventEndDate" TIMESTAMP(3);
ALTER TABLE "Sponsorship" ADD COLUMN IF NOT EXISTS "story" TEXT;
ALTER TABLE "Sponsorship" ADD COLUMN IF NOT EXISTS "galleryUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "PrizeVoucher" ADD COLUMN IF NOT EXISTS "winnerEmail" TEXT;
ALTER TABLE "PrizeVoucher" ADD COLUMN IF NOT EXISTS "winnerInstagramUrl" TEXT;
ALTER TABLE "PrizeVoucher" ADD COLUMN IF NOT EXISTS "award" TEXT;
