-- Persist the server-priced checkout quote so Razorpay webhooks can recover
-- payments when the browser callback is interrupted.
CREATE TABLE "CheckoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "quote" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastError" TEXT,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutSession_razorpayOrderId_key" ON "CheckoutSession"("razorpayOrderId");
CREATE INDEX "CheckoutSession_userId_status_idx" ON "CheckoutSession"("userId", "status");
CREATE INDEX "CheckoutSession_paymentId_idx" ON "CheckoutSession"("paymentId");

ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
