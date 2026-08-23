CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "productId" TEXT,
    "productSlug" TEXT,
    "orderId" TEXT,
    "state" TEXT,
    "pincodePrefix" TEXT,
    "device" TEXT,
    "referrer" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_name_idx" ON "AnalyticsEvent"("name");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX "AnalyticsEvent_state_idx" ON "AnalyticsEvent"("state");
CREATE INDEX "AnalyticsEvent_pincodePrefix_idx" ON "AnalyticsEvent"("pincodePrefix");
