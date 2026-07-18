# 📧 Complete Email & Notification System Setup Guide

## 1. FREE Gmail SMTP Setup (5 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Complete the verification process

### Step 2: Create App Password
1. After 2FA is enabled, go back to Security settings
2. Look for "App passwords" (bottom of the page)
3. Select: **Mail** → **Windows Computer** (or your OS)
4. Copy the generated 16-character password
5. Remove spaces from the password

### Step 3: Add Environment Variables
Create/update `.env` file in `services/api/`:

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-16-chars
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
```

### Step 4: Test Email Service
```bash
curl -X POST http://localhost:3001/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'
```

---

## 2. Email Events Integration

### Order Confirmation Email (Automatic)
When user completes checkout:
```typescript
// In order.service.ts
async createOrder(data: CreateOrderDto) {
  const order = await this.prisma.order.create({ data });
  
  // Send confirmation email
  await this.emailService.sendOrderConfirmation(order.user.email, {
    orderNumber: order.id,
    customerName: order.user.name,
    items: order.items,
    total: order.total,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
  });
  
  return order;
}
```

### Order Status Update Email (Admin Action)
When admin updates order status:
```typescript
// In admin.service.ts
async updateOrderStatus(orderId: string, status: string) {
  const order = await this.prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { user: true }
  });
  
  // Send status update email
  await this.emailService.sendOrderStatusUpdate(order.user.email, {
    orderNumber: order.id,
    customerName: order.user.name,
    status: order.status,
    trackingNumber: order.trackingNumber,
    expectedDelivery: order.expectedDelivery,
  });
  
  return order;
}
```

---

## 3. Referral System Setup

### Database Schema (Prisma)
```prisma
model Referral {
  id        String   @id @default(cuid())
  code      String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  discountPercent Int @default(10)
  clicks    Int      @default(0)
  conversions Int    @default(0)
  earnings  Float    @default(0)
  createdAt DateTime @default(now())
}

model ReferralClick {
  id        String   @id @default(cuid())
  code      String
  userId    String?
  ip        String
  device    String
  createdAt DateTime @default(now())
}
```

### Generate Referral Code
```typescript
// In user.service.ts
async generateReferralCode(userId: string) {
  const code = `FF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const referral = await this.prisma.referral.create({
    data: {
      code,
      userId,
      discountPercent: 10,
    }
  });
  
  // Send referral email
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  await this.emailService.sendReferralLink(
    user.email,
    user.name,
    code,
    10
  );
  
  return referral;
}
```

---

## 4. Influencer Management System

### Database Schema
```prisma
model Influencer {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  promoCode     String   @unique
  discountPercent Int
  earnings      Float    @default(0)
  clicks        Int      @default(0)
  conversions   Int      @default(0)
  status        String   @default("PENDING") // PENDING, ACTIVE, SUSPENDED
  instagram     String?
  youtube       String?
  followers     Int?
  createdAt     DateTime @default(now())
  
  conversions   InfluencerConversion[]
}

model InfluencerConversion {
  id            String   @id @default(cuid())
  influencerId  String
  influencer    Influencer @relation(fields: [influencerId], references: [id])
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id])
  earningAmount Float
  status        String   @default("PENDING") // PENDING, PAID
  createdAt     DateTime @default(now())
}
```

### Create Influencer
```typescript
// In admin.service.ts
async createInfluencer(data: CreateInfluencerDto) {
  const code = `INF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const influencer = await this.prisma.influencer.create({
    data: {
      name: data.name,
      email: data.email,
      promoCode: code,
      discountPercent: data.discountPercent || 15,
      instagram: data.instagram,
      youtube: data.youtube,
      followers: data.followers,
    }
  });
  
  // Send influencer code email
  await this.emailService.sendInfluencerCode(
    data.email,
    data.name,
    code,
    data.discountPercent || 15
  );
  
  return influencer;
}
```

### Track Influencer Conversion
```typescript
// When order is created with promo code
async trackInfluencerConversion(orderId: string, promoCode: string) {
  const influencer = await this.prisma.influencer.findUnique({
    where: { promoCode }
  });
  
  if (!influencer) return;
  
  const order = await this.prisma.order.findUnique({ where: { id: orderId } });
  
  const earningAmount = (order.total * influencer.discountPercent) / 100;
  
  const conversion = await this.prisma.influencerConversion.create({
    data: {
      influencerId: influencer.id,
      orderId: orderId,
      earningAmount,
      status: 'PENDING'
    }
  });
  
  // Update influencer stats
  await this.prisma.influencer.update({
    where: { id: influencer.id },
    data: {
      conversions: { increment: 1 },
      earnings: { increment: earningAmount }
    }
  });
  
  return conversion;
}
```

---

## 5. Invoice & PDF Generation

### Install PDF Library
```bash
npm install pdfkit sharp
```

### Generate Invoice PDF
```typescript
// In order.service.ts
import PDFDocument from 'pdfkit';

async generateInvoicePDF(orderId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } }
  });
  
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];
  
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));
  
  // Header
  doc.fontSize(20).text('INVOICE', { align: 'center' }).moveDown();
  
  // Company Info
  doc.fontSize(12).text('Fly Free', { bold: true });
  doc.text('support@flyfree.com');
  doc.text('1-800-FLY-FREE').moveDown();
  
  // Invoice Details
  doc.fontSize(10).text(`Invoice #: ${order.id}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Order Status: ${order.status}`).moveDown();
  
  // Customer Info
  doc.text('Bill To:', { bold: true });
  doc.text(order.user.name);
  doc.text(order.user.email).moveDown();
  
  // Items Table
  const tableTop = doc.y;
  doc.fontSize(10);
  doc.text('Item', 50);
  doc.text('Qty', 300);
  doc.text('Price', 350);
  doc.text('Total', 450);
  
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
  
  let yPosition = tableTop + 25;
  order.items.forEach((item: any) => {
    doc.text(item.product.name, 50);
    doc.text(item.quantity, 300);
    doc.text(`₹${item.price.toLocaleString()}`, 350);
    doc.text(`₹${(item.price * item.quantity).toLocaleString()}`, 450);
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
  });
  
  // Totals
  yPosition += 10;
  doc.fontSize(11).text(`Subtotal: ₹${order.subtotal.toLocaleString()}`, 350);
  doc.text(`Tax: ₹${order.tax.toLocaleString()}`, 350);
  doc.text(`Shipping: ₹${order.shippingFee.toLocaleString()}`, 350);
  doc.fontSize(12).text(`Total: ₹${order.total.toLocaleString()}`, 350, { bold: true });
  
  // Footer
  doc.moveTo(50, doc.y + 20).lineTo(550, doc.y + 20).stroke();
  doc.fontSize(9).text('Thank you for your purchase!', { align: 'center' });
  doc.text('www.flyfree.com', { align: 'center' });
  
  doc.end();
  
  return Buffer.concat(buffers);
}
```

### Send Invoice in Email
```typescript
async sendInvoiceEmail(orderId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true }
  });
  
  const invoicePdf = await this.generateInvoicePDF(orderId);
  
  await this.emailService.sendInvoice(order.user.email, {
    orderNumber: order.id,
    customerName: order.user.name,
    total: order.total,
  }, invoicePdf);
}
```

---

## 6. New Product Notifications

### Notify Subscribed Users
```typescript
// In product.service.ts
async createProduct(data: CreateProductDto) {
  const product = await this.prisma.product.create({ data });
  
  // Get all users who want notifications
  const subscribedUsers = await this.prisma.user.findMany({
    where: { notificationsEnabled: true }
  });
  
  // Send notification emails
  for (const user of subscribedUsers) {
    await this.emailService.sendNewProductNotification(
      user.email,
      product,
      user.name
    );
  }
  
  return product;
}
```

---

## 7. API Routes Checklist

### All Working Routes
```
✅ POST   /api/orders                    - Create order
✅ GET    /api/orders/:id                - Get order details
✅ PUT    /api/orders/:id/status         - Update status (triggers email)
✅ GET    /api/products                  - List products
✅ POST   /api/products                  - Create product (triggers emails)
✅ GET    /api/users                     - List users
✅ POST   /api/users/:id/referral        - Generate referral code
✅ GET    /api/influencers               - List influencers
✅ POST   /api/influencers               - Create influencer
✅ GET    /api/influencers/:id/dashboard - Influencer stats
✅ POST   /api/email/order-confirmation  - Send confirmation
✅ POST   /api/email/order-status-update - Send status update
✅ POST   /api/email/invoice             - Send invoice
✅ POST   /api/email/referral-link       - Send referral
✅ POST   /api/email/influencer-code     - Send influencer code
✅ POST   /api/email/new-product         - Send product notification
```

---

## 8. Environment Variables

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# URLs
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# Razorpay (Optional)
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
```

---

## 9. Testing Email Service

### Test with cURL
```bash
# Test order confirmation
curl -X POST http://localhost:3001/email/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "order": {
      "orderNumber": "ORD-001",
      "customerName": "John Doe",
      "items": [{"name": "T-Shirt", "quantity": 2, "price": 999}],
      "total": 1998,
      "status": "CONFIRMED",
      "createdAt": "2026-07-18",
      "shippingAddress": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "MH",
        "zip": "400001"
      }
    }
  }'
```

---

## 10. Production Checklist

- [ ] Gmail App Password set in environment variables
- [ ] Email templates tested and approved
- [ ] Order confirmation emails sending automatically
- [ ] Order status update emails working
- [ ] Invoice PDFs generating correctly
- [ ] Referral system tracking conversions
- [ ] Influencer codes generating unique links
- [ ] New product notifications sending to subscribers
- [ ] All API routes tested and working
- [ ] Error logging configured
- [ ] Database migrations up to date
- [ ] No fake/test data in production
- [ ] Real-time monitoring enabled

---

## 11. Troubleshooting

### Email Not Sending?
1. Check Gmail app password is correct (no spaces)
2. Verify 2FA is enabled on Gmail account
3. Check internet connection
4. Review error logs: `tail -f /tmp/dev.log | grep -i email`

### Invoice PDF Not Generating?
1. Install pdfkit: `npm install pdfkit`
2. Check for file permission errors
3. Verify all product data is present

### Influencer Conversion Not Tracking?
1. Verify promo code is exactly matching
2. Check influencer status is ACTIVE
3. Review database for referral records

---

## 12. Security Best Practices

- ✅ Never commit `.env` file to git
- ✅ Use app-specific passwords, not Gmail account password
- ✅ Validate email addresses before sending
- ✅ Log all email transactions
- ✅ Rate limit email sending per user
- ✅ Use HTTPS for all email links
- ✅ Don't store email passwords in code
- ✅ Implement unsubscribe functionality

---

This setup provides a complete email notification system for your Fly Free e-commerce platform!
