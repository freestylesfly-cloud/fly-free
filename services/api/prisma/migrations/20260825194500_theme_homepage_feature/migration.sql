ALTER TABLE "Theme" ADD COLUMN "featureImageUrl" TEXT;
ALTER TABLE "Theme" ADD COLUMN "homepageFeatured" BOOLEAN NOT NULL DEFAULT false;
