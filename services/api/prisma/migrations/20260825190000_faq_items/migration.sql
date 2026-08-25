CREATE TABLE "FaqItem" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Support',
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqItem_active_idx" ON "FaqItem"("active");
CREATE INDEX "FaqItem_category_idx" ON "FaqItem"("category");
CREATE INDEX "FaqItem_priority_idx" ON "FaqItem"("priority");
