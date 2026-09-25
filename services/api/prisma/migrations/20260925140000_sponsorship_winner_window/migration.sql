-- Retire a winners list automatically, and keep the storefront lookup cheap.
--
-- Vouchers and sponsorships are never deleted, so the public query has to stay
-- index-served as the tables grow rather than scanning more rows every year.

ALTER TABLE "Sponsorship" ADD COLUMN IF NOT EXISTS "winnersUntil" TIMESTAMP(3);

-- Covers the storefront's filter (isActive + the startsAt/endsAt window) and the
-- ordering, so the homepage read never widens into a sequential scan.
CREATE INDEX IF NOT EXISTS "Sponsorship_isActive_startsAt_endsAt_priority_idx"
  ON "Sponsorship"("isActive", "startsAt", "endsAt", "priority");
