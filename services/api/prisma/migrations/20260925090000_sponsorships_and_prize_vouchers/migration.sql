-- Sponsorship prize vouchers.
--
-- Purely additive: three new tables and no change to any existing one, so the
-- API running before this is applied is unaffected by it. That is what lets the
-- migration be run against live BEFORE the code that uses it is deployed.
--
-- Written by hand rather than by `prisma migrate dev`, which cannot run here:
-- the schema declares no shadowDatabaseUrl and the database user cannot CREATE
-- DATABASE. Applied with `npm run db:migrate:deploy`.

CREATE TABLE IF NOT EXISTS "Sponsorship" (
  "id"             TEXT NOT NULL,
  "partnerName"    TEXT NOT NULL,
  "partnerHandle"  TEXT,
  "partnerUrl"     TEXT,
  "eventName"      TEXT NOT NULL,
  "eventDate"      TIMESTAMP(3),
  "location"       TEXT,
  "headline"       TEXT,
  "blurb"          TEXT,
  "bannerImageUrl" TEXT,
  "partnerLogoUrl" TEXT,
  "isActive"       BOOLEAN NOT NULL DEFAULT false,
  "priority"       INTEGER NOT NULL DEFAULT 0,
  "startsAt"       TIMESTAMP(3),
  "endsAt"         TIMESTAMP(3),
  "showWinners"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Sponsorship_isActive_priority_idx" ON "Sponsorship"("isActive", "priority");

CREATE TABLE IF NOT EXISTS "PrizeVoucher" (
  "id"              TEXT NOT NULL,
  "sponsorshipId"   TEXT NOT NULL,
  "code"            TEXT NOT NULL,
  "winnerName"      TEXT NOT NULL,
  "winnerPhone"     TEXT,
  "position"        INTEGER,
  -- Whole rupees, matching Order.total. The catalog stores paise; this does not.
  "value"           INTEGER NOT NULL,
  "balance"         INTEGER NOT NULL,
  "maxRedemptions"  INTEGER NOT NULL DEFAULT 2,
  "redemptionsUsed" INTEGER NOT NULL DEFAULT 0,
  "expiresAt"       TIMESTAMP(3),
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "claimedByUserId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrizeVoucher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PrizeVoucher_code_key" ON "PrizeVoucher"("code");
CREATE INDEX IF NOT EXISTS "PrizeVoucher_sponsorshipId_idx" ON "PrizeVoucher"("sponsorshipId");
CREATE INDEX IF NOT EXISTS "PrizeVoucher_claimedByUserId_idx" ON "PrizeVoucher"("claimedByUserId");

CREATE TABLE IF NOT EXISTS "VoucherRedemption" (
  "id"           TEXT NOT NULL,
  "voucherId"    TEXT NOT NULL,
  "orderId"      TEXT,
  "userId"       TEXT,
  -- Positive on REDEEM, negative on REVERSAL.
  "amount"       INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "kind"         TEXT NOT NULL DEFAULT 'REDEEM',
  "note"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- Turns a replayed webhook or a repeated cancellation into a no-op rather than
-- a second movement of the same credit.
CREATE UNIQUE INDEX IF NOT EXISTS "VoucherRedemption_voucherId_orderId_kind_key"
  ON "VoucherRedemption"("voucherId", "orderId", "kind");
CREATE INDEX IF NOT EXISTS "VoucherRedemption_voucherId_idx" ON "VoucherRedemption"("voucherId");
CREATE INDEX IF NOT EXISTS "VoucherRedemption_orderId_idx" ON "VoucherRedemption"("orderId");

DO $$ BEGIN
  ALTER TABLE "PrizeVoucher" ADD CONSTRAINT "PrizeVoucher_sponsorshipId_fkey"
    FOREIGN KEY ("sponsorshipId") REFERENCES "Sponsorship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PrizeVoucher" ADD CONSTRAINT "PrizeVoucher_claimedByUserId_fkey"
    FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "PrizeVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
