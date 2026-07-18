# 🎯 Fly Free - Full Implementation Plan

## Phase Overview

### ✅ **Phase 1: Admin Authentication** (DONE)
- ✅ Admin login with JWT
- ✅ Admin dashboard
- ✅ Email management
- ✅ Error handling & database seeding

### 🚀 **Phase 2: User Authentication** (NEXT)
**Timeline**: 2-3 hours

**Features**:
- User signup with email, phone (10 digit), password
- Email verification (send verification code to email)
- User login/logout
- User session persistence
- User profile page
- User dashboard (orders, wishlist)

**Database Tables**:
- User (already exists, may need updates)
- UserProfile (additional info)
- EmailVerification (verification tokens)

### 🏪 **Phase 3: App Settings & Admin Control** (AFTER USER AUTH)
**Timeline**: 2-3 hours

**Features**:
- App settings table (logo, favicon, title, etc.)
- Business info management
- Invoice details
- Contact information
- Social media links
- Admin UI to manage all settings

**Database Tables**:
- AppSettings
- BusinessInfo
- InvoiceTemplate

### 📄 **Phase 4: Static Pages Management** (AFTER SETTINGS)
**Timeline**: 2 hours

**Features**:
- About Us page
- Vision & Mission page
- Terms & Conditions
- Return Policy
- Size Chart
- Contact Us
- Privacy Policy
- FAQ

**Database Tables**:
- Page (for dynamic content storage)
- PageSection (for page components)

### 🛍️ **Phase 5: Product Pages & Checkout** (AFTER PAGES)
**Timeline**: 3-4 hours

**Features**:
- Product listing (with filters, search)
- Product detail page
- Reviews & ratings
- Add to cart (localStorage)
- Wishlist
- Checkout flow
- Order tracking

---

## Detailed Phase 2: User Authentication

### Database Schema Changes

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  phone       String?  @unique  // 10 digit validation
  password    String?  // hashed
  name        String?
  avatar      String?
  
  emailVerified Boolean @default(false)
  
  profile     UserProfile?
  
  orders      Order[]
  reviews     Review[]
  wishlist    Wishlist[]
  addresses   Address[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  phone       String?  // 10 digit
  dateOfBirth DateTime?
  gender      String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model EmailVerification {
  id          String   @id @default(cuid())
  email       String   @unique
  code        String   // 6-digit code
  expiresAt   DateTime
  
  createdAt   DateTime @default(now())
}
```

### API Endpoints

#### Authentication
```
POST   /api/auth/user/signup          - Register user
POST   /api/auth/user/login           - Login user
POST   /api/auth/user/logout          - Logout user
POST   /api/auth/user/verify-email    - Verify email code
POST   /api/auth/user/resend-email    - Resend verification email
GET    /api/auth/user/profile         - Get user profile
PUT    /api/auth/user/profile         - Update user profile
POST   /api/auth/user/change-password - Change password
```

#### User Features
```
GET    /api/user/orders               - List user orders
GET    /api/user/orders/:id           - Get order details
GET    /api/user/wishlist             - Get wishlist
POST   /api/user/wishlist/:productId  - Add to wishlist
DELETE /api/user/wishlist/:productId  - Remove from wishlist
GET    /api/user/addresses            - Get addresses
POST   /api/user/addresses            - Add address
PUT    /api/user/addresses/:id        - Update address
DELETE /api/user/addresses/:id        - Delete address
```

### Frontend Pages

```
/signup              - Registration form
/login               - Login form
/verify-email        - Email verification page
/profile             - User profile
/orders              - Order history
/orders/:id          - Order details
/wishlist            - Wishlist page
/settings            - User settings
```

### Validation Rules

**Email**: Standard email format
**Phone**: Exactly 10 digits
**Password**: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
**Name**: 2-50 characters

---

## Detailed Phase 3: App Settings

### Database Schema

```prisma
model AppSettings {
  id              String   @id @default("default")
  
  // Brand Info
  appName         String   @default("Fly Free")
  appLogo         String?
  appFavicon      String?
  appTitle        String?
  appDescription  String?
  
  // Business Info
  businessName    String?
  ownerName       String?
  teamName        String?
  
  // Contact
  email           String?
  phone           String?
  address         String?
  city            String?
  state           String?
  postalCode      String?
  country         String?
  
  // Social
  facebook        String?
  instagram       String?
  twitter         String?
  linkedin        String?
  youtube         String?
  
  // SEO
  seoTitle        String?
  seoDescription  String?
  seoKeywords     String?
  
  // Invoice
  invoicePrefix   String   @default("INV")
  taxRate         Float    @default(18)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Page {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  content     String   // Rich HTML content
  metaTitle   String?
  metaDesc    String?
  
  isPublished Boolean @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Admin API Endpoints

```
GET    /api/admin/settings            - Get app settings
PUT    /api/admin/settings            - Update settings
GET    /api/admin/pages               - List pages
GET    /api/admin/pages/:slug         - Get page
POST   /api/admin/pages               - Create page
PUT    /api/admin/pages/:id           - Update page
DELETE /api/admin/pages/:id           - Delete page
```

### Admin UI Pages

```
/settings                 - App settings editor
/settings/business        - Business info
/settings/social          - Social media links
/settings/invoice         - Invoice settings
/pages                    - Page management
/pages/new                - Create new page
/pages/:id/edit           - Edit page
```

---

## Detailed Phase 4: Static Pages

**Pages to Create**:
1. About Us
2. Vision & Mission
3. Terms & Conditions
4. Return Policy
5. Privacy Policy
6. Size Chart
7. Contact Us
8. FAQ

Each page stored in database, editable from admin panel.

---

## Implementation Checklist

### Phase 2: User Authentication
- [ ] Update User/UserProfile schema
- [ ] Create EmailVerification table
- [ ] Add signup endpoint
- [ ] Add email verification flow
- [ ] Add login endpoint
- [ ] Add user profile endpoints
- [ ] Create user frontend pages
- [ ] Add cart persistence (localStorage)
- [ ] Add checkout page

### Phase 3: App Settings
- [ ] Create AppSettings table
- [ ] Create Page table
- [ ] Add admin settings endpoints
- [ ] Create admin settings UI
- [ ] Add page management endpoints
- [ ] Create page admin UI

### Phase 4: Static Pages
- [ ] Create About page
- [ ] Create Terms page
- [ ] Create Privacy page
- [ ] Create Contact page
- [ ] Create Size Chart page
- [ ] Create FAQ page

---

## Database Seeding

After migration, seed with:

**App Settings**:
```
{
  appName: "Fly Free",
  businessName: "Fly Free Pvt Ltd",
  ownerName: "Your Name",
  email: "support@flyfree.com",
  phone: "9876543210"
}
```

**Pages**:
- About Us content
- Terms & Conditions
- Privacy Policy
- Size Chart HTML
- Contact info

**Users**:
- Test users for development

---

## Priority Order

1. **Must Have (Phase 2)**:
   - User registration/login ✅ CRITICAL
   - Email verification ✅ CRITICAL
   - Session persistence ✅ CRITICAL

2. **Should Have (Phase 3-4)**:
   - App settings management
   - Static pages
   - User profile

3. **Nice to Have**:
   - OTP verification (if free service available)
   - Social login (Google, GitHub)
   - Two-factor authentication

---

## Time Estimates

| Phase | Component | Time |
|-------|-----------|------|
| 2 | User Auth (Backend) | 2 hours |
| 2 | User Auth (Frontend) | 1.5 hours |
| 3 | App Settings (Backend) | 1.5 hours |
| 3 | App Settings (Frontend) | 1.5 hours |
| 4 | Static Pages | 2 hours |
| 5 | Product/Checkout | 3-4 hours |

**Total**: ~13-15 hours for full implementation

---

## Next Steps

1. Start with **Phase 2: User Authentication**
2. Implement backend endpoints
3. Create frontend pages
4. Test complete flow
5. Move to Phase 3

Ready to start? Let me know! 🚀
