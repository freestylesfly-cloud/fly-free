-- Convert size guides from measurement rows to one chart record per fit type.
-- Existing uploaded chart images and notes are preserved by keeping the first
-- image-backed row for each fit, then the first row if no image exists.

CREATE TABLE "SizeGuide_fit_only" (
  "id" TEXT NOT NULL,
  "fitType" TEXT NOT NULL DEFAULT 'regular',
  "chartImageUrl" TEXT,
  "note" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SizeGuide_fit_only_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SizeGuide_fit_only" ("id", "fitType", "chartImageUrl", "note", "priority", "active", "createdAt", "updatedAt")
SELECT DISTINCT ON ("fitType")
  "id",
  COALESCE(NULLIF("fitType", ''), 'regular') AS "fitType",
  "chartImageUrl",
  "note",
  "priority",
  "active",
  "createdAt",
  "updatedAt"
FROM "SizeGuide"
ORDER BY "fitType", ("chartImageUrl" IS NULL), "priority" ASC, "createdAt" ASC;

DROP TABLE "SizeGuide";

ALTER TABLE "SizeGuide_fit_only" RENAME TO "SizeGuide";

CREATE UNIQUE INDEX "SizeGuide_fitType_key" ON "SizeGuide"("fitType");
CREATE INDEX "SizeGuide_fitType_idx" ON "SizeGuide"("fitType");
CREATE INDEX "SizeGuide_active_idx" ON "SizeGuide"("active");
