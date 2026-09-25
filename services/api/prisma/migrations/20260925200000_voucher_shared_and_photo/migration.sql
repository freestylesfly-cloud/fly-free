-- A voucher can be a named person's prize (the default) or a code anyone may
-- spend, and a winner can carry a photo for the public card.

ALTER TABLE "PrizeVoucher" ADD COLUMN IF NOT EXISTS "lockToFirstUser" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PrizeVoucher" ADD COLUMN IF NOT EXISTS "winnerImageUrl" TEXT;
