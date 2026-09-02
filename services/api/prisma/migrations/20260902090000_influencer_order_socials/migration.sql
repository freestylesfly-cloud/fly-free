ALTER TABLE "Influencer"
ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT,
ADD COLUMN IF NOT EXISTS "instagramFollowers" INTEGER,
ADD COLUMN IF NOT EXISTS "facebookFollowers" INTEGER,
ADD COLUMN IF NOT EXISTS "xFollowers" INTEGER,
ADD COLUMN IF NOT EXISTS "youtubeFollowers" INTEGER,
ADD COLUMN IF NOT EXISTS "homepageFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Influencer_isActive_displayOrder_idx" ON "Influencer"("isActive", "displayOrder");
