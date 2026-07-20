# Admin Portal - Quick Start Guide

## ✅ What's Fixed

### API Errors
- **HTTP 500 on /api/admin/products** ✅ FIXED
  - Removed invalid `hampers` field from Prisma queries
  - API now fully operational

### Routes & Navigation
- **Missing /admin route** ✅ FIXED
  - Automatically redirects to `/` (dashboard)
  - Added middleware for route protection

### Admin Panel Features
- **Professional Navigation** ✅ COMPLETE
- **All Admin Routes** ✅ WORKING
- **Custom Orders Management** ✅ ADDED

---

## 🚀 Quick Access

### Main Dashboard
```
http://localhost:3002/
```

### Product Management
```
- List: http://localhost:3002/products
- Create: http://localhost:3002/products/new
- Edit: http://localhost:3002/products/[id]/edit
- Details: http://localhost:3002/products/[id]
```

### Order Management
```
- Orders: http://localhost:3002/orders
- Custom Orders: http://localhost:3002/custom-orders
```

### Inventory
```
- Categories: http://localhost:3002/categories
- Themes: http://localhost:3002/themes
```

### Users & Community
```
- Users: http://localhost:3002/users
- Influencers: http://localhost:3002/influencers
- Reviews: http://localhost:3002/reviews
```

### Content & Marketing
```
- Announcements: http://localhost:3002/announcements
- Pages: http://localhost:3002/pages
- Website Themes: http://localhost:3002/website-themes
- Email: http://localhost:3002/email
- Notifications: http://localhost:3002/notifications
```

### Settings
```
- Settings: http://localhost:3002/settings
```

---

## 💳 Payment Setup (IMPORTANT)

### Razorpay Configuration

**Current Status:**
- ✅ Key ID: `rzp_test_TEXx7YJ7eN3lsD`
- ❌ Key Secret: MISSING

**To Enable Payments:**

1. Go to: https://razorpay.com/dashboard/settings/api-keys
2. Copy your **Test Mode - Secret Key**
3. Add to `.env.local`:
   ```
   RAZORPAY_KEY_SECRET="your-secret-key-here"
   ```
4. Restart the API server

---

## 📊 Admin Dashboard Features

### Analytics & Metrics
- Total Revenue
- Order Count
- Product Inventory
- User Statistics
- Pending Orders Alert
- Low Stock Notifications
- Customer Reviews
- Average Rating

### Quick Actions
- Create Product
- View Orders
- Manage Users
- Access Settings

---

## 🔑 Testing Credentials

### Admin Account
```
Email: admin@flyfree.com
Password: [From your setup]
```

### Test Razorpay Card (When Payment Setup Complete)
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: 123
```

---

## 🛠️ Development Commands

### Start Admin Portal
```bash
npm run dev:admin
# or
cd apps/admin && npm run dev
```

### Start API Server
```bash
npm run dev:api
# or
cd services/api && npm run dev
```

### Start Web App
```bash
npm run dev:web
# or
cd apps/web && npm run dev
```

### Start All (from root)
```bash
npm run dev
```

---

## 📝 Admin Workflow

### 1. Product Management
1. Go to **Products**
2. Click **Create Product** or **New**
3. Fill in product details
4. Add images
5. Set pricing
6. Save

### 2. Order Management
1. Go to **Orders**
2. View recent orders
3. Click order to see details
4. Update status (Processing → Shipped → Delivered)
5. Generate invoice if needed

### 3. Custom Design Orders
1. Go to **Custom Orders**
2. Review design requests
3. Set pricing
4. Update status (Pending → Approved/Rejected)
5. Customer gets notified

### 4. User Management
1. Go to **Users**
2. View all registered users
3. Check user details
4. Monitor user activity

---

## 🐛 Troubleshooting

### Products Page Shows Error
**Solution:** Make sure API is running (`npm run dev:api`)

### Can't Login to Admin
**Solution:** Check JWT_SECRET in `.env.local`

### Payment Tests Failing
**Solution:** Add Razorpay Key Secret to `.env.local`

### Routes Not Found (404)
**Solution:** Clear browser cache and restart all dev servers

---

## 📚 Key Files

### Admin App
```
apps/admin/
├── app/
│   ├── page.tsx (Dashboard)
│   ├── products/ (Product routes)
│   ├── orders/ (Order routes)
│   ├── custom-orders/ (Custom design orders)
│   ├── components/
│   │   ├── Sidebar.tsx (Navigation)
│   │   ├── DashboardLayout.tsx
│   │   └── [other components]
│   └── services/
│       └── api.ts (API service)
└── middleware.ts (Route protection)
```

### API
```
services/api/src/
├── admin/ (Admin endpoints)
├── catalog/ (Product catalog)
├── orders/ (Order management)
└── [other modules]
```

---

## ✨ Pro Tips

1. **Bulk Import:** Use CSV files to import products
2. **Search:** Use search bar to find products/orders quickly
3. **Filters:** Apply filters to narrow down results
4. **Mobile:** Admin works on mobile (responsive design)
5. **Export:** Export order data for reporting

---

## 🎯 Next Steps

1. ✅ Test Admin Login
2. ✅ Navigate All Routes
3. ✅ Create Test Product
4. ✅ Create Test Order
5. ⚠️  Add Razorpay Secret
6. ✅ Test Payment Flow
7. ✅ Review Custom Orders

---

## 📞 Support

For issues or questions, check:
- API error logs: `services/api/logs/`
- Admin console: Browser DevTools (F12)
- Database: Prisma Studio (`npx prisma studio`)

