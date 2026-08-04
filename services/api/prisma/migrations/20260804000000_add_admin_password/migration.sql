-- Admin login previously issued a token on email alone, with no secret to check.
-- Nullable so existing admins survive; login rejects a NULL hash until one is set.
ALTER TABLE "AdminUser" ADD COLUMN "passwordHash" TEXT;
