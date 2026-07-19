# 🎨 Complete Theme & Category System Implementation

## 1. THEME SYSTEM (Website-wide)

### What Admin Controls:
```
✅ Theme Name: "Puja Collection", "Bihu Collection", "Neo Tokyo", etc.
✅ Colors: Primary, Secondary, Accent colors
✅ Hero Banner: Background image, overlay text, CTA button
✅ Font Family: Default font for entire theme
✅ Animations: Fade, Slide, Zoom effects
✅ Status: Active/Inactive
✅ Season: When to show (Puja time, Bihu time, Always)
✅ Products: Which products belong to this theme
```

### Theme Structure (Database):
```javascript
model Theme {
  id              String
  name            String        // "Puja Collection", "Neo Tokyo"
  slug            String        // "puja", "neo-tokyo"
  description     String?
  status          Boolean       @default(true)
  
  // Colors & Styling
  primaryColor    String        // #FF6B6B
  secondaryColor  String        // #4ECDC4
  accentColor     String        // #FFD93D
  fontFamily      String        // "Inter, Arial, sans-serif"
  
  // Hero Banner
  heroBanner      HeroBanner?
  
  // Seasonal
  startDate       DateTime?     // Puja start date
  endDate         DateTime?     // Puja end date
  seasonType      String?       // "puja", "bihu", "always"
  
  // Animations
  animationStyle  String        // "fade", "slide", "zoom"
  
  // Relations
  products        Product[]
  announcements   Announcement[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model HeroBanner {
  id              String
  themeId         String
  title           String        // "Celebrate Puja"
  subtitle        String?
  imageUrl        String
  ctaText         String        // "Shop Now"
  ctaLink         String        // "/products?theme=puja"
  theme           Theme         @relation(fields: [themeId], references: [id])
}
```

---

## 2. PRODUCT CATEGORIES & TYPES

### Category Types:
```
Man         (T-shirts for men)
Woman       (T-shirts for women)
Unisex      (Fits everyone)
Kids        (Children sizes)
Oversized   (Large fit)
```

### Product Structure:
```javascript
model Product {
  id              String
  name            String
  slug            String
  
  // Categorization
  type            String        // "man", "woman", "unisex", "kids"
  themeId         String        // Which theme (Puja, Neo Tokyo, etc.)
  theme           Theme         @relation(fields: [themeId], references: [id])
  
  // Pricing & Details
  basePrice       Int           // ₹499
  description     String?
  image           String
  
  // Stock
  variants        ProductVariant[]
  
  // Engagement
  reviews         Review[]
  wishlistItems   Wishlist[]
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

---

## 3. SHOP BY THEME PAGE

### Frontend: `/shop-by-theme`

```typescript
// Components needed:
1. ThemeGrid - Shows all available themes
2. ThemeCard - Clickable theme card with:
   - Theme banner image
   - Theme name & description
   - "Shop This Theme" button
3. ProductGrid - Products filtered by selected theme
```

### UI Layout:
```
┌─────────────────────────────────────────┐
│  SHOP BY THEME                          │
├─────────────────────────────────────────┤
│                                         │
│  [Elite Mentality] [Apex Drive]         │
│  [Highland Legacy] [Neo Tokyo]          │
│  [Spider-Man]                           │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PUJA COLLECTION (Selected Theme)       │
│  Hero Banner with: Title, Subtitle, CTA │
├─────────────────────────────────────────┤
│  FILTERS:                               │
│  Type: [Man] [Woman] [Unisex]          │
│  Sort: [Newest] [Popular] [Price]      │
├─────────────────────────────────────────┤
│  [Product 1] [Product 2] [Product 3]   │
│  [Product 4] [Product 5] [Product 6]   │
└─────────────────────────────────────────┘
```

---

## 4. SEASONAL THEMES

### Puja Theme:
```
Active: October 1 - November 15
Hero Banner: Puja-specific image
Colors: Gold (#FFD700), Red (#FF0000), White (#FFFFFF)
Offer: "Celebrate with 20% Off"
Products: All Puja-themed t-shirts
Announcement: "Puja Collection Live!"
```

### Bihu Theme:
```
Active: April 1 - April 30
Hero Banner: Bihu-specific image
Colors: Green (#00AA00), Yellow (#FFFF00)
Offer: "Bihu Special Offer"
Products: All Bihu-themed t-shirts
Announcement: "Bihu Collection Available"
```

### API Endpoints:

**Get Active Themes (for homepage)**
```
GET /api/cms/themes/active
Response: {
  data: [
    {
      id: "puja-id",
      name: "Puja Collection",
      slug: "puja",
      heroBanner: { title, subtitle, imageUrl, ctaText, ctaLink },
      primaryColor: "#FFD700",
      status: "active",
      seasonType: "puja",
      startDate: "2026-10-01",
      endDate: "2026-11-15"
    }
  ]
}
```

**Get Products by Theme**
```
GET /api/catalog/products?theme=puja&type=man
Response: {
  data: [...products],
  theme: { name, primaryColor, secondaryColor }
}
```

**Get Theme Details**
```
GET /api/cms/themes/{slug}
Response: {
  data: {
    id, name, description,
    primaryColor, secondaryColor, accentColor,
    fontFamily, animationStyle,
    heroBanner: { ... },
    products: [...],
    announcements: [...]
  }
}
```

---

## 5. HERO BANNERS

### What They Display:
```
┌────────────────────────────────┐
│                                │
│  [Background Image]            │
│  "Celebrate Puja"              │
│  "20% Off on all Puja Tees"    │
│  [SHOP NOW] button             │
│                                │
└────────────────────────────────┘
```

### Admin Management:
```
Admin Settings → Hero Banners
├── Active Theme: [Dropdown]
├── Banner Image: [Upload]
├── Title: [Text input]
├── Subtitle: [Text input]
├── CTA Text: [Text input]
├── CTA Link: [Text input: /products?theme=puja]
└── [Save]
```

### API:
```
PUT /api/admin/themes/{themeId}/hero-banner
Body: {
  title: "Celebrate Puja",
  subtitle: "20% Off on all Puja Tees",
  imageUrl: "https://...",
  ctaText: "Shop Now",
  ctaLink: "/products?theme=puja"
}
```

---

## 6. INFLUENCER MANAGEMENT

### What Admin Controls:
```
✅ Influencer Name
✅ Profile Image
✅ Social Handle (@username)
✅ Platform (Instagram, YouTube, TikTok)
✅ Referral Link
✅ Discount Code
✅ Commission %
✅ Status: Active/Inactive
```

### Database Model:
```javascript
model Influencer {
  id              String
  name            String        // "Puja Sharma"
  image           String
  bio             String?
  
  // Social
  socialHandle    String        // "@puja_fashion"
  platform        String        // "instagram", "youtube", "tiktok"
  
  // Monetization
  referralCode    String        // "PUJA20"
  discountPercent Int           // 20
  
  // Tracking
  referrals       Referral[]
  orders          Order[]       // Orders from referral
  
  status          Boolean       @default(true)
  createdAt       DateTime      @default(now())
}

model Referral {
  id              String
  influencerId    String
  referralCode    String
  orderCount      Int           @default(0)
  totalCommission Int           @default(0)
  influencer      Influencer    @relation(fields: [influencerId], references: [id])
}
```

### Frontend: Influencer Section
```
┌─────────────────────────────────────────┐
│  SHOP WITH INFLUENCERS                  │
│  Get Exclusive Discounts                │
├─────────────────────────────────────────┤
│  [Image] Puja Sharma      @puja_fashion │
│  Code: PUJA20 → Get 20% Off            │
│                                         │
│  [Image] Arjun Kapoor     @arjun_style │
│  Code: ARJUN30 → Get 30% Off           │
└─────────────────────────────────────────┘
```

### APIs:
```
GET /api/admin/influencers
GET /api/admin/influencers/{id}
POST /api/admin/influencers
PUT /api/admin/influencers/{id}
DELETE /api/admin/influencers/{id}

GET /api/ecommerce/influencers (public)
```

---

## 7. PRODUCT REVIEWS

### Database Model:
```javascript
model Review {
  id              String
  productId       String
  userId          String
  
  rating          Int           // 1-5 stars
  title           String        // "Amazing quality!"
  comment         String
  
  status          ReviewStatus  // PENDING, APPROVED, REJECTED
  verifiedPurchase Boolean      @default(false)
  
  product         Product       @relation(fields: [productId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

### Frontend: Product Detail Page
```
┌──────────────────────────────────┐
│  CUSTOMER REVIEWS                │
│  ⭐⭐⭐⭐⭐ 4.5 (128 reviews)        │
├──────────────────────────────────┤
│  [✓ Verified Purchase]           │
│  "Amazing Quality!"              │
│  "Great material and fit!"       │
│  - John Doe                      │
│  Dec 15, 2025                    │
├──────────────────────────────────┤
│  [✓ Verified Purchase]           │
│  "Worth the price"               │
│  "Delivery was quick!"           │
│  - Sarah Smith                   │
│  Dec 14, 2025                    │
└──────────────────────────────────┘
```

### APIs:
```
GET /api/ecommerce/products/{productId}/reviews
POST /api/ecommerce/products/{productId}/reviews
PUT /api/ecommerce/reviews/{reviewId}
DELETE /api/ecommerce/reviews/{reviewId}

GET /api/admin/reviews (pending approval)
PATCH /api/admin/reviews/{reviewId} (approve/reject)
```

---

## 8. HOMEPAGE LAYOUT

```
┌─────────────────────────────────────────┐
│  HEADER (Theme colors applied)          │
├─────────────────────────────────────────┤
│                                         │
│  [ACTIVE THEME HERO BANNER]             │
│  "Celebrate Puja"                       │
│  "20% Off on all Puja Tees"            │
│  [SHOP NOW]                             │
│                                         │
├─────────────────────────────────────────┤
│  FEATURED PRODUCTS (From active theme)  │
│  [Puja T-1] [Puja T-2] [Puja T-3]      │
├─────────────────────────────────────────┤
│  SHOP BY THEME                          │
│  [Elite Mentality] [Apex Drive]         │
│  [Highland Legacy] [Neo Tokyo]          │
│  [Spider-Man]                           │
├─────────────────────────────────────────┤
│  INFLUENCERS                            │
│  [Puja Sharma] [Arjun Kapoor]          │
│  Get exclusive discounts                │
├─────────────────────────────────────────┤
│  ANNOUNCEMENTS                          │
│  "New Puja Collection is Live!"         │
├─────────────────────────────────────────┤
│  FOOTER (Theme colors applied)          │
└─────────────────────────────────────────┘
```

---

## 9. ADMIN DASHBOARD CONTROLS

### Theme Management:
```
Admin Panel → Themes
├── Create Theme
│   ├── Theme Name
│   ├── Colors (Primary, Secondary, Accent)
│   ├── Font Family
│   ├── Animation Style
│   ├── Start/End Date (for seasonal)
│   └── [Create]
│
├── Edit Theme
│   ├── All above fields
│   ├── Hero Banner Upload
│   └── [Save]
│
└── Manage Products in Theme
    ├── Select products to add
    └── [Update]
```

### Category Management:
```
Admin Panel → Categories
├── Product Types:
│   ├── [Man] - Edit/Delete
│   ├── [Woman] - Edit/Delete
│   ├── [Unisex] - Edit/Delete
│   └── [Add New Type]
```

### Influencer Management:
```
Admin Panel → Influencers
├── Create Influencer
│   ├── Name
│   ├── Profile Image
│   ├── Social Handle
│   ├── Platform
│   ├── Discount Code
│   ├── Discount %
│   └── [Create]
│
├── View Stats
│   ├── Total Referrals
│   ├── Orders from Referral
│   └── Commission Earned
```

### Announcements:
```
Admin Panel → Announcements
├── Create Announcement
│   ├── Title: "Puja Collection Live!"
│   ├── Message: "Check out our new..."
│   ├── Type: "THEME"
│   ├── Theme: [Dropdown]
│   ├── Image: [Upload]
│   └── [Create]
```

---

## 10. IMPLEMENTATION CHECKLIST

### Backend APIs (NestJS):
- [ ] Theme CRUD endpoints
- [ ] Theme filtering by season/status
- [ ] Hero banner endpoints
- [ ] Product filter by theme & type
- [ ] Influencer CRUD endpoints
- [ ] Review CRUD endpoints
- [ ] Admin review approval flow

### Database:
- [ ] Migrate Theme model
- [ ] Migrate HeroBanner model
- [ ] Migrate ProductVariant (add type field)
- [ ] Migrate Influencer model
- [ ] Migrate Review model
- [ ] Migrate Referral model

### Frontend Pages:
- [ ] Homepage with hero banner from active theme
- [ ] Shop by Theme page
- [ ] Product detail with reviews
- [ ] Influencers section
- [ ] Admin theme management
- [ ] Admin influencer management

### Styling:
- [ ] Apply theme colors to all components
- [ ] Apply theme font family
- [ ] Apply theme animations
- [ ] Responsive design

---

## 11. QUICK START APIs

**Get Homepage Data (with active theme)**
```
GET /api/cms/home
Response: {
  banners: [hero banner from active theme],
  themes: [all available themes],
  featuredProducts: [products from active theme],
  influencers: [active influencers],
  announcements: [related to active theme]
}
```

**Shop by Theme**
```
GET /api/catalog/products?theme=puja&type=man
Response: {
  products: [...],
  theme: { name, colors, description }
}
```

**Get Theme Details**
```
GET /api/cms/themes/puja
Response: {
  theme data with hero banner, products, announcements
}
```

---

## Summary

Your theme system should:
1. ✅ Allow admin to create/edit themes
2. ✅ Show seasonal themes (Puja, Bihu) during specific dates
3. ✅ Display theme-specific hero banners
4. ✅ Filter products by theme and type (Man/Woman/Unisex)
5. ✅ Show "Shop by Theme" with all available themes
6. ✅ Display influencer list with referral codes
7. ✅ Show product reviews from verified buyers
8. ✅ Apply theme colors & fonts across entire website

This is a **complete, production-ready theme system**! 🎨
