-- One gateway payment can only ever pay for one order. Razorpay retries its
-- callback and customers double-click, so without this a replayed verification
-- could create a second order for money that was only collected once.

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
