# 📌 Fly Free - Quick Reference Card

**Print this or bookmark it! Quick lookup while coding.**

---

## 🎯 PROJECT AT A GLANCE

| Item | Status | Details |
|------|--------|---------|
| **Database** | ✅ Ready | Neon PostgreSQL (22 models) |
| **Auth** | ⏳ Setup | Supabase Email Auth |
| **Types** | ✅ Complete | 50+ TypeScript interfaces |
| **Themes** | ✅ Ready | 10 themes with CSS variables |
| **Framework** | ✅ Ready | Next.js 15 + NestJS |
| **Styling** | ✅ Ready | Tailwind + CSS Modules |
| **State** | ✅ Ready | Zustand stores |

---

## 🚀 QUICK COMMANDS

```bash
npm run dev           # Start all 3 servers
npm install           # Install dependencies
npm run build         # Build for production

# Database
npx prisma migrate dev
npx prisma studio           # View database
npx prisma generate         # Regenerate client

# Frontend
cd apps/web && npm run dev

# Admin
cd apps/admin && npm run dev

# Backend
cd services/api && npm run start:dev
```

---

## 📂 KEY FILES LOCATIONS

| What | Where |
|------|-------|
| Themes config | `apps/web/src/config/themes.ts` |
| CSS variables | `apps/web/src/styles/variables.css` |
| Theme store | `apps/web/src/store/themeStore.ts` |
| Database schema | `services/api/prisma/schema.prisma` |
| Types | `packages/types/src/` |
| Environment vars | `.env.local` |

---

## 🎨 CSS VARIABLES (Copy-Paste)

### Colors
```css
var(--color-primary)      /* Brand color */
var(--color-secondary)    /* Secondary */
var(--color-background)   /* Background */
var(--color-text)         /* Text */
var(--color-accent)       /* Accent */
var(--color-error)        /* Error red */
var(--color-success)      /* Success green */
var(--color-warning)      /* Warning yellow */
var(--color-border)       /* Border color */
```

### Spacing
```css
var(--spacing-xs)   /* 0.25rem */
var(--spacing-sm)   /* 0.5rem */
var(--spacing-md)   /* 1rem */
var(--spacing-lg)   /* 1.5rem */
var(--spacing-xl)   /* 2rem */
var(--spacing-2xl)  /* 3rem */
var(--spacing-3xl)  /* 4rem */
```

### Radius
```css
var(--radius-sm)    /* 0.25rem */
var(--radius-md)    /* 0.5rem */
var(--radius-lg)    /* 1rem */
var(--radius-xl)    /* 1.5rem */
var(--radius-full)  /* 9999px (circle) */
```

### Animations
```css
var(--transition-fast)    /* 150ms */
var(--transition-base)    /* 300ms */
var(--transition-slow)    /* 500ms */
```

---

## 🎨 10 THEMES

| Theme | Color | Style |
|-------|-------|-------|
| 🎌 Anime | Orange/Blue | Bold, vibrant |
| 🦸 Marvel | Red/Gold | Superhero |
| 🕷️ Spider-Man | Red/Blue | Comic |
| 🌾 Assam | Brown/Gold | Cultural |
| ⚪ Minimal | Black/White | Clean |
| 🎨 Graphic | Pink/Cyan | Modern |
| ✍️ Typography | Brown/Red | Elegant |
| 🎮 Gaming | Green/Magenta | Neon |
| 🌙 Dark | Blue/Dark | Night mode |
| ☀️ Light | Blue/Light | Day mode |

**User can switch anytime** → All colors update instantly!

---

## 💾 DATABASE MODELS (22 Total)

```
User               Address           Cart
CartItem           Product           ProductImage
ProductVariant     Inventory         Order
OrderItem          Coupon            Payment
Review             Wishlist          HeroBanner
GiftOption         Notification      CustomizationRequest
Influencer         Referral          WebsiteTheme
Return             AdminUser         Role
Permission         Category          Theme
Collection
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
@media (min-width: 640px)   { /* sm */ }
@media (min-width: 768px)   { /* md */ }
@media (min-width: 1024px)  { /* lg */ }
@media (min-width: 1280px)  { /* xl */ }
```

---

## 🔑 API STRUCTURE

### Auth
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/logout
GET    /api/auth/me
```

### Products
```
GET    /api/products
GET    /api/products/:slug
POST   /api/products (admin)
PUT    /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

### Cart
```
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
```

### Orders
```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status (admin)
```

---

## 🧩 COMPONENT TEMPLATE

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
      <h2>{title}</h2>
      <button onClick={onClick}>Click</button>
    </div>
  );
}
```

**CSS File:**
```css
.container {
  padding: var(--spacing-lg);
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
}
```

---

## 🛠️ ZUSTAND STORE TEMPLATE

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface State {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCountStore = create<State>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
    }),
    { name: 'count-store' }
  )
);
```

**Usage:**
```typescript
const { count, increment } = useCountStore();
```

---

## 🚨 ERROR HANDLING PATTERN

```typescript
async function fetchData() {
  try {
    setLoading(true);
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    setData(data);
  } catch (err) {
    setError(err.message);
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
}
```

---

## 📊 COMPONENT FILE STRUCTURE

```
Component/
├── Component.tsx        (component code)
├── Component.module.css (styles)
├── types.ts            (types for this component)
└── index.ts            (export)
```

---

## 🎯 COMMON PATTERNS

### Fetch with Loading
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(r => r.json())
    .then(setData)
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
return <div>{JSON.stringify(data)}</div>;
```

### Theme Usage
```typescript
'use client';

import { useThemeStore } from '@/store/themeStore';

export function MyComponent() {
  const { currentTheme, setTheme } = useThemeStore();
  
  return (
    <div>
      Current: {currentTheme}
      <button onClick={() => setTheme('anime')}>
        Switch to Anime
      </button>
    </div>
  );
}
```

---

## ✅ PRE-COMMIT CHECKLIST

Before committing code:
- [ ] No `console.log` (except errors)
- [ ] No `any` types
- [ ] CSS not inline
- [ ] Props typed
- [ ] Error handling added
- [ ] Loading states shown
- [ ] Mobile tested (375px)
- [ ] No secrets in code
- [ ] No node_modules committed

---

## 🔐 ENV VARIABLES TO FILL

```env
DATABASE_URL                    ← From Neon
NEXT_PUBLIC_SUPABASE_URL        ← From Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   ← From Supabase
SUPABASE_SERVICE_ROLE_KEY       ← From Supabase
```

Everything else has defaults or can wait.

---

## 📚 DOCUMENTATION MAP

| Need | File |
|------|------|
| Quick start | QUICK_START.md |
| Setup keys | ENV_SETUP.md |
| How to build | IMPLEMENTATION_GUIDE.md |
| Architecture | ARCHITECTURE.md |
| Progress | BUILD_SUMMARY.md |
| This card | REFERENCE_CARD.md |

---

## 🎨 DESIGN TOKENS

```
Primary Color: var(--color-primary)
Hover: opacity: 0.8
Active: opacity: 0.7
Disabled: opacity: 0.5
Focus Ring: 0 0 0 3px rgba(color, 0.1)
Transition: var(--transition-base)
```

---

## 🧪 TESTING CHECKLIST

```
Desktop (1200px)    ← Start here
Tablet (768px)      ← Test layout
Mobile (375px)      ← Test touch
Portrait mode       ← Tall screens
Landscape mode      ← Wide screens
Dark mode           ← Theme toggle
Light mode          ← Default
Slow 3G             ← Performance
```

---

## 🚀 DEPLOYMENT COMMANDS

```bash
# Frontend
cd apps/web
vercel deploy

# Admin
cd apps/admin
vercel deploy

# Backend
cd services/api
# Deploy to Railway/Render/Hetzner
```

---

## 💡 QUICK TIPS

**Tip 1:** Use CSS variables instead of hardcoding colors
```css
/* Good */
color: var(--color-primary);

/* Bad */
color: #FF6B35;
```

**Tip 2:** Extract components early
```tsx
// Instead of large components, break into:
<Container>
  <Header />
  <ProductList />
  <Sidebar />
  <Footer />
</Container>
```

**Tip 3:** Use TypeScript for props
```tsx
interface Props {
  title: string;
  count: number;
  onClick: () => void;
}

export function Component({ title, count, onClick }: Props) {}
```

**Tip 4:** Always handle errors
```tsx
try { } catch (e) { toast.error(e.message); }
```

**Tip 5:** Test on mobile first
```bash
npm run dev
# Then check on your phone at: http://your-ip:3000
```

---

## 📞 TROUBLESHOOTING QUICK FIX

| Issue | Fix |
|-------|-----|
| Port in use | `PORT=3100 npm run dev` |
| Module not found | `npm install` |
| TypeScript error | Check types, hover in VS Code |
| Component not updating | Check Zustand state |
| CSS not applying | Check class names, CSS modules |
| Theme not working | Check `data-theme` on html |
| Database error | Run `npx prisma db push` |
| Build fails | `rm -rf .next && npm run build` |

---

## 🎯 YOUR NEXT 3 STEPS

1. **Fill Supabase keys** in `.env.local`
2. **Run `npm install && npm run dev`**
3. **Build first component** (Button, Header, etc.)

**That's it! Everything else follows naturally.**

---

**Bookmark this for quick reference while coding! 📌**

**Status:** ✅ Ready to build  
**Time to first feature:** ~30 min  
**Support:** Check docs or ask!  

🚀 **Let's ship this!**
