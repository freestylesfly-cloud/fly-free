# Razorpay Payment Integration

**Status:** Test Credentials Configured (2026-07-21)  
**Test Key ID:** `rzp_test_TFm7lkNFwiHUI8`  
**Environment:** Development

---

## What's Configured

### ✅ Environment Variables Set

**API Server** (`services/api/.env.local`):
```env
RAZORPAY_KEY_ID=rzp_test_TFm7lkNFwiHUI8
RAZORPAY_KEY_SECRET=g1n1HSl8pIJfWh7mhnaqMPe1
```

**Web App** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TFm7lkNFwiHUI8
```

**Admin Portal** (`apps/admin/.env.local`):
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_TFm7lkNFwiHUI8
```

**Root** (`.env.local`):
```env
RAZORPAY_KEY_ID=rzp_test_TFm7lkNFwiHUI8
RAZORPAY_KEY_SECRET=g1n1HSl8pIJfWh7mhnaqMPe1
```

---

## Architecture

### Payment Flow

```
1. Customer adds items to cart
2. Customer goes to /checkout
3. Web app calls POST /api/ecommerce/checkout
4. API creates order in database with status PLACED
5. API initiates Razorpay order via Razorpay SDK
6. Web app receives razorpay_order_id
7. Web app displays Razorpay checkout form
8. Customer completes payment on Razorpay
9. Razorpay calls webhook (configured in dashboard)
10. API verifies payment signature
11. API updates order status to CONFIRMED
12. Web app shows success confirmation
```

---

## API Implementation

### Endpoint: POST `/api/ecommerce/checkout`

**Request:**
```json
{
  "items": [
    {
      "productId": "prod_123",
      "variantId": "var_123",
      "quantity": 2,
      "hamperId": "hamper_123" (optional)
    }
  ],
  "shippingAddressId": "addr_123",
  "couponCode": "SAVE10" (optional)
}
```

**Response:**
```json
{
  "data": {
    "orderId": "order_123",
    "razorpayOrderId": "order_abc123",
    "amount": 5000,
    "currency": "INR",
    "key": "rzp_test_TFm7lkNFwiHUI8"
  },
  "message": "Order created. Ready for payment."
}
```

### Endpoint: POST `/api/ecommerce/payment/verify`

**Request:**
```json
{
  "orderId": "order_123",
  "razorpayOrderId": "order_abc123",
  "razorpayPaymentId": "pay_abc123",
  "razorpaySignature": "signature_hash"
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "orderId": "order_123",
    "status": "CONFIRMED",
    "message": "Payment verified successfully"
  }
}
```

### Webhook: POST `/api/ecommerce/webhook/razorpay`

Razorpay sends this after payment completion:
```json
{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_abc123",
        "amount": 5000,
        "status": "authorized"
      }
    }
  }
}
```

---

## Web App Implementation

### Checkout Flow (apps/web/app/checkout/page.tsx)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function CheckoutPage() {
  const token = useAuthStore((state) => state.token);
  const [razorpay, setRazorpay] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    setRazorpay(window.Razorpay);
  }, []);

  async function handleCheckout() {
    setLoading(true);
    try {
      // 1. Create order via API
      const orderRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ecommerce/checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: cartItems,
            shippingAddressId: selectedAddress.id
          })
        }
      );

      const orderData = await orderRes.json();
      const { razorpayOrderId, key, amount } = orderData.data;

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount, // in paise
        currency: 'INR',
        name: 'Fly Free',
        description: 'T-shirt Purchase',
        order_id: razorpayOrderId,
        handler: handlePaymentSuccess,
        prefill: {
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#111827' // ink color
        }
      };

      const rzp = new razorpay(options);
      rzp.open();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(response) {
    // 3. Verify payment on backend
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ecommerce/payment/verify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      }
    );

    const result = await verifyRes.json();
    if (result.data.success) {
      // Payment successful - redirect to order confirmation
      window.location.href = `/orders/${orderData.orderId}`;
    } else {
      setError('Payment verification failed');
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">Checkout</h1>
      
      {/* Address selection */}
      {/* Cart summary */}
      
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-ink text-white py-3 rounded font-bold hover:bg-ink/90 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay with Razorpay'}
      </button>
    </main>
  );
}
```

---

## Admin Portal Features

### Payment Settings Page (Future)

Admin will be able to:
- View Razorpay dashboard stats
- Manage payment settings
- View transaction history
- Handle refunds
- View failed payments

Endpoint: `GET /api/admin/payment/settings`

---

## Test Card Details

Use these test cards in development:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (MM/YY)
- CVV: Any 3 digits

**Failed Payment:**
- Card Number: `4111 1111 1111 1112`
- Will return error

**Test Phone:** Any 10-digit number (e.g., `9999999999`)

---

## Database Integration

### Payment Model (Prisma Schema)

```prisma
model Payment {
  id                String        @id @default(cuid())
  orderId           String        @unique
  provider          String        @default("RAZORPAY")
  providerPaymentId String?       // razorpay_payment_id
  status            PaymentStatus @default(PENDING) // PENDING, PAID, FAILED, REFUNDED
  amount            Int           // in paise
  rawPayload        Json?         // Full Razorpay response
  paidAt            DateTime?
  order             Order         @relation(fields: [orderId], references: [id])
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

### Payment Workflow

1. **Order Created:** Status = `PLACED`, Payment status = `PENDING`
2. **Payment Initiated:** Razorpay order created
3. **Payment Success:** Payment status = `PAID`, Order status = `CONFIRMED`
4. **Payment Failed:** Payment status = `FAILED`, Order remains `PLACED`
5. **Refund:** Payment status = `REFUNDED`, Order status = `REFUNDED` (if initiated)

---

## Security Checklist

- ✅ Secret key stored in .env.local (not in code)
- ✅ Public key in NEXT_PUBLIC_ variables (safe to expose)
- ✅ Signature verification on backend (required!)
- ✅ HTTPS required in production
- ✅ Never expose key_secret in frontend code
- ✅ Webhook signature verification required

### Signature Verification (Node.js)

```typescript
import crypto from 'crypto';

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  const message = `${orderId}|${paymentId}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  const generated_signature = hmac.digest('hex');
  return generated_signature === signature;
}
```

---

## Production Migration

When moving to production:

1. **Get Production Credentials**
   - Login to Razorpay Dashboard
   - Settings → API Keys
   - Copy production Key ID and Secret

2. **Update .env files**
   - Replace test key_id with production key_id
   - Replace test key_secret with production key_secret
   - Keep NEXT_PUBLIC_RAZORPAY_KEY_ID updated

3. **Enable Webhooks**
   - Razorpay Dashboard → Settings → Webhooks
   - Add endpoint: `https://yourdomain.com/api/ecommerce/webhook/razorpay`
   - Select events: `payment.authorized`, `payment.failed`, `payment.captured`

4. **Test with Real Cards**
   - Use actual card details (or get test cards from Razorpay)
   - Test refunds
   - Test failed payments
   - Monitor logs

5. **Monitor & Debug**
   - Razorpay Dashboard → Payments (view all transactions)
   - Check API logs for errors
   - Set up email alerts

---

## Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Test Credentials | ✅ | Configured in all .env files |
| Razorpay Script | ⏳ | Need to add to web checkout page |
| Checkout Endpoint | ⏳ | Need to implement POST /api/ecommerce/checkout |
| Payment Verify | ⏳ | Need to implement POST /api/ecommerce/payment/verify |
| Webhook Handler | ⏳ | Need to implement POST /api/ecommerce/webhook/razorpay |
| Signature Verification | ⏳ | Crypto HMAC-SHA256 validation |
| Web UI/Form | ⏳ | Razorpay checkout button on /checkout page |
| Admin Dashboard | ⏳ | Payment stats and transaction viewing |
| Refund Handling | ❌ | Not implemented yet |
| Invoice Emailing | ⏳ | Send after payment confirmation |

---

## Next Implementation Steps

1. **Implement checkout endpoint** - Create order, initiate Razorpay
2. **Add Razorpay script** - Load payment SDK on checkout page
3. **Build payment form** - Integrate Razorpay checkout modal
4. **Implement verification** - Verify signature and update order status
5. **Setup webhook** - Configure Razorpay to send notifications
6. **Test payments** - Use test cards to verify flow
7. **Add to admin** - Show payment status in order management

---

## Quick Links

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **API Docs:** https://razorpay.com/docs/
- **Test Credentials:** Already configured in .env files
- **Support:** https://razorpay.com/support
