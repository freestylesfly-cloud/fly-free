-- Product types above styles: T-Shirts / Hoodies / Socks / Caps, each with its
-- own sizes. Additive only: one new table and one nullable column. Products,
-- variants and orders are not touched — orders keep their own name/SKU/price.

CREATE TABLE IF NOT EXISTS "ProductType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "sizes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductType_slug_key" ON "ProductType"("slug");
CREATE INDEX IF NOT EXISTS "ProductType_isActive_priority_idx" ON "ProductType"("isActive", "priority");

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "productTypeId" TEXT;
CREATE INDEX IF NOT EXISTS "Category_productTypeId_idx" ON "Category"("productTypeId");
DO $$ BEGIN
  ALTER TABLE "Category" ADD CONSTRAINT "Category_productTypeId_fkey"
    FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The four types the shop sells. Empty types stay hidden on the storefront.
INSERT INTO "ProductType" ("id", "name", "slug", "description", "sizes", "priority") VALUES
  ('ptype_tshirts', 'T-Shirts', 't-shirts', 'Theme tees in regular, oversized and polo fits.', ARRAY['S','M','L','XL','XXL'], 1),
  ('ptype_hoodies', 'Hoodies', 'hoodies', 'Warm hoodies for cool evenings.', ARRAY['S','M','L','XL','XXL'], 2),
  ('ptype_socks', 'Socks', 'socks', 'Fun, comfy socks to finish the fit.', ARRAY['Free size','UK 6-8','UK 9-11'], 3),
  ('ptype_caps', 'Caps', 'caps', 'Caps with an adjustable strap.', ARRAY['Free size'], 4)
ON CONFLICT ("slug") DO NOTHING;

-- Every existing style is a T-shirt style.
UPDATE "Category" SET "productTypeId" = (SELECT "id" FROM "ProductType" WHERE "slug" = 't-shirts')
WHERE "productTypeId" IS NULL;

-- Starter styles for the new types.
INSERT INTO "Category" ("id", "name", "slug", "priority", "productTypeId") VALUES
  ('cat_pullover_hoodie', 'Pullover', 'pullover-hoodie', 1, 'ptype_hoodies'),
  ('cat_zipup_hoodie', 'Zip-up', 'zip-up-hoodie', 2, 'ptype_hoodies'),
  ('cat_ankle_socks', 'Ankle', 'ankle-socks', 1, 'ptype_socks'),
  ('cat_crew_socks', 'Crew', 'crew-socks', 2, 'ptype_socks'),
  ('cat_baseball_cap', 'Baseball', 'baseball-cap', 1, 'ptype_caps'),
  ('cat_snapback_cap', 'Snapback', 'snapback-cap', 2, 'ptype_caps')
ON CONFLICT ("slug") DO NOTHING;
