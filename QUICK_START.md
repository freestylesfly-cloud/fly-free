# ⚡ Fly Free - Quick Start Guide

## 🏃 Get Started in 5 Minutes

### 1. Setup Environment
```bash
# Clone/navigate to project
cd d:\flyfree\flyfree-platform

# Copy environment file
cp .env.example .env.local

# Fill these in .env.local:
# - DATABASE_URL="postgresql://..." (from Neon)
# - SUPABASE_URL="https://..." (from Supabase)
# - SUPABASE_ANON_KEY="..." (from Supabase)
# - SUPABASE_SERVICE_ROLE_KEY="..." (from Supabase)
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
cd services/api
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 4. Start Development
```bash
npm run dev
# Opens:
# - http://localhost:3000 (User site)
# - http://localhost:3001 (Backend API)
# - http://localhost:3002 (Admin site)
```

---

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Full folder structure |
| `IMPLEMENTATION_GUIDE.md` | Code examples for each phase |
| `BUILD_SUMMARY.md` | What's done, what's next |
| `apps/web/src/config/themes.ts` | Theme definitions |
| `apps/web/src/styles/variables.css` | CSS variables |
| `apps/web/src/store/themeStore.ts` | Theme state management |
| `packages/types/src/` | All TypeScript types |
| `services/api/prisma/schema.prisma` | Database schema |

---

## 🎨 Available Themes

Switch themes instantly - user can choose:

```
🎌 Anime - Orange & Blue, bold fonts
🦸 Marvel - Red & Gold, superhero style
🕷️ Spider-Man - Red & Blue, comic vibes
🌾 Assam - Brown & Gold, cultural
⚪ Minimal - Black & White, clean
🎨 Graphic - Pink & Cyan, modern
✍️ Typography - Brown & Red, elegant
🎮 Gaming - Green & Magenta, neon
🌙 Dark - Blue on dark background
☀️ Light - Blue on light background (default)
```

---

## 🛠️ Common Commands

```bash
# Install dependencies
npm install

# Start dev servers (all 3 apps)
npm run dev

# Run migrations
cd services/api && npx prisma migrate dev

# Generate Prisma client
cd services/api && npx prisma generate

# View database
cd services/api && npx prisma studio

# Build for production
npm run build

# Seed dummy data
cd services/api && npx prisma db seed

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📦 Database Models Ready

✅ 22 Complete Models:
- Users & Authentication
- Products with Images & Variants
- Orders & Payments
- Cart & Wishlist
- Reviews & Ratings
- Custom Designs
- Referrals & Influencers
- Admin Roles & Permissions

All with proper relationships and enums.

---

## 🎯 Build Phases (In Order)

### Phase 2: Frontend Shell (4-6 hours)
- [ ] Update RootLayout with providers
- [ ] Create Header component
- [ ] Create Footer component
- [ ] Create Sidebar/Mobile Nav
- [ ] Build Login page
- [ ] Build Signup page
- [ ] Create AuthStore

### Phase 3: Cart (3-4 hours)
- [ ] Create CartStore
- [ ] Build Cart page
- [ ] Add to cart functionality
- [ ] Merge carts on login

### Phase 4: Product Listing (5-6 hours)
- [ ] Fetch products API
- [ ] Product card component
- [ ] Product grid
- [ ] Lazy load images
- [ ] Add pagination
- [ ] Add search & filters

### Phase 5: Admin (8-10 hours)
- [ ] Admin login page
- [ ] Admin dashboard
- [ ] Products table with CRUD
- [ ] Orders management
- [ ] User management

### Phase 6: Checkout (6-8 hours)
- [ ] Product detail page
- [ ] Color/size selector
- [ ] Image zoom gallery
- [ ] Checkout flow
- [ ] Address management
- [ ] Order creation

---

## 💻 Component Templates

### Page Component
```typescript
'use client';

import { useState, useEffect } from 'react';
import styles from './Page.module.css';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load data
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return <div className={styles.container}>Content here</div>;
}
```

### Component with Styles
```typescript
'use client';

import styles from './Component.module.css';

interface Props {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: Props) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <button onClick={onClick} className={styles.button}>
        Click Me
      </button>
    </div>
  );
}
```

### Zustand Store
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface State {
  value: string;
  setValue: (val: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      value: '',
      setValue: (val) => set({ value: val }),
    }),
    { name: 'store-name' }
  )
);
```

---

## 🎨 Use CSS Variables

Instead of hardcoding colors:

```typescript
// ❌ DON'T
<div style={{ color: '#FF6B35' }}>
  Text
</div>

// ✅ DO
<div className={styles.text}>
  Text
</div>

// In .module.css:
.text {
  color: var(--color-primary);
  font-family: var(--font-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}
```

---

## 🚨 Error Handling Pattern

```typescript
// ✅ Correct
async function fetchData() {
  try {
    setLoading(true);
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    setData(data);
  } catch (err) {
    setError(err.message);
    // Show toast
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
}
```

---

## 📱 Mobile First

```css
/* Start with mobile */
.container {
  display: block;
  width: 100%;
}

/* Then desktop */
@media (min-width: 768px) {
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## 🔄 API Call Pattern

```typescript
// services/api/products.ts
export async function getProducts(page: number, filters: any) {
  const params = new URLSearchParams({
    page: page.toString(),
    ...filters,
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// In component
const [products, setProducts] = useState([]);

useEffect(() => {
  getProducts(1, {})
    .then(setProducts)
    .catch(err => console.error(err));
}, []);
```

---

## 🧪 Testing Checklist

Before committing:
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1200px)
- [ ] All links work
- [ ] Theme switcher works
- [ ] Dark mode works
- [ ] Buttons are clickable
- [ ] Forms validate input

---

## 🐛 Debug Mode

Enable debugging:

```typescript
// In .env.local
DEBUG=true

// In component
if (process.env.DEBUG) {
  console.log('Debug info:', data);
}
```

Use React DevTools:
- Install Chrome extension
- Open DevTools → Components tab
- Inspect component tree
- Modify props/state to test

---

## 📊 Key API Endpoints (Build These First)

### Authentication
- `POST /api/auth/signup` → Create user account
- `POST /api/auth/signin` → Login user
- `GET /api/auth/me` → Get current user

### Products
- `GET /api/products` → List all products
- `GET /api/products/:slug` → Get one product
- `GET /api/products/:id/reviews` → Get reviews

### Cart
- `GET /api/cart` → Get user cart
- `POST /api/cart/items` → Add item
- `PUT /api/cart/items/:id` → Update item
- `DELETE /api/cart/items/:id` → Remove item

### Orders
- `POST /api/orders` → Create order
- `GET /api/orders` → Get user orders
- `GET /api/orders/:id` → Get order details

---

## ✅ Success Checklist

When you're ready:
- [ ] Database migrations ran successfully
- [ ] npm run dev starts all 3 servers
- [ ] No TypeScript errors
- [ ] Header displays with theme switcher
- [ ] Theme switcher changes colors
- [ ] Dark mode toggle works
- [ ] Mobile menu responsive
- [ ] Footer displays
- [ ] Login page loads
- [ ] Forms have proper styling

---

## 🚀 Deploy Commands

```bash
# Build everything
npm run build

# Deploy frontend to Vercel
cd apps/web && vercel deploy

# Deploy admin to Vercel
cd apps/admin && vercel deploy

# Deploy backend to Railway/Hetzner
cd services/api && <deploy-command>
```

---

## 📚 Reading Order

1. **This file** (5 min) ← You are here
2. **ARCHITECTURE.md** (10 min) - Understand folder structure
3. **BUILD_SUMMARY.md** (15 min) - See what's done
4. **IMPLEMENTATION_GUIDE.md** (30 min) - Copy code examples
5. **Start building!** 🎉

---

## 🆘 Stuck?

### Check these first:
1. Does `npm run dev` show errors?
2. Are environment variables set?
3. Is database migrated?
4. Is TypeScript complaining?
5. Check browser console for errors

### Common fixes:
```bash
# Update dependencies
npm install

# Clear cache
rm -rf .next node_modules
npm install

# Regenerate Prisma
cd services/api && npx prisma generate

# Check database
cd services/api && npx prisma studio

# Reset everything
npm run clean && npm install && npm run dev
```

---

## 🎯 Next Action

```bash
# 1. Open terminal
cd d:\flyfree\flyfree-platform

# 2. Install
npm install

# 3. Setup .env
cp .env.example .env.local
# Edit .env.local with your Supabase/Neon keys

# 4. Migrate database
cd services/api
npx prisma migrate dev --name init
cd ../..

# 5. Start building!
npm run dev
```

**You got this! 🚀**

---

**Last Update:** 2026-07-18  
**Ready to build:** ✅ YES  
**Questions?** Ask anytime!
