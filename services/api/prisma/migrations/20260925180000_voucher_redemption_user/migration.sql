-- Link a redemption to the customer who spent the credit.
--
-- The userId column already exists; this only adds the foreign key so the admin
-- ledger can show who used a voucher, when, and on which order.

CREATE INDEX IF NOT EXISTS "VoucherRedemption_userId_idx" ON "VoucherRedemption"("userId");

DO $$ BEGIN
  ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
