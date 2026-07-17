# Fly Free - Complete Implementation Guide

## ✅ What's Done
- ✅ Folder structure designed
- ✅ Prisma schema with all models
- ✅ Environment variables setup
- ✅ Shared types package
- ✅ Theme configuration system
- ✅ CSS variables for dynamic theming
- ✅ Theme store (Zustand)

---

## 🚀 What to Build Next (In Order)

### PHASE 1: Database & Backend Setup

#### Step 1: Run Prisma Migrations
```bash
cd services/api
npx prisma migrate dev --name init
npx prisma generate
```

#### Step 2: Create Auth Service (NestJS)
File: `services/api/src/auth/auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async signUp(email: string, password: string, name: string) {
    // Create in Supabase
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
    });

    if (error) throw new Error(error.message);

    // Create in Prisma
    const user = await this.prisma.user.create({
      data: {
        id: data.user.id,
        email,
        name,
      },
    });

    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
      },
    });

    return {
      user,
      token: data.session.access_token,
    };
  }

  async sendMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${this.configService.get('APP_URL')}/auth/callback`,
      },
    });

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
```

---

### PHASE 2: Frontend Shell & Layout

#### Step 1: Create Providers Component
File: `apps/web/src/providers.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function Providers({ children }: { children: ReactNode }) {
  const { currentTheme } = useThemeStore();

  return (
    <div data-theme={currentTheme}>
      {children}
    </div>
  );
}
```

#### Step 2: Create Header Component
File: `apps/web/src/components/common/Header.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useThemeStore } from '@/store/themeStore';
import { THEME_LABELS } from '@/config/themes';
import styles from './Header.module.css';

export function Header() {
  const { currentTheme, setTheme, toggleDarkMode, isDarkMode } = useThemeStore();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span>🚀 Fly Free</span>
        </Link>

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link href="/shop">Shop</Link>
          <Link href="/designer">Designer</Link>
          <Link href="/referral">Referral</Link>
        </nav>

        {/* Right Side */}
        <div className={styles.actions}>
          {/* Theme Selector */}
          <select
            value={currentTheme}
            onChange={(e) => setTheme(e.target.value as any)}
            className={styles.themeSelect}
          >
            {Object.entries(THEME_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={styles.darkModeToggle}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Cart */}
          <Link href="/cart" className={styles.cart}>
            🛒 Cart
          </Link>

          {/* Profile */}
          <Link href="/profile" className={styles.profile}>
            👤 Profile
          </Link>
        </div>
      </div>
    </header>
  );
}
```

#### Step 3: Create Header Styles
File: `apps/web/src/components/common/Header.module.css`

```css
.header {
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: var(--spacing-xl);
  flex: 1;
  justify-content: center;
}

.nav a {
  color: var(--color-text);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.nav a:hover {
  color: var(--color-primary);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.themeSelect {
  background-color: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.darkModeToggle,
.cart,
.profile {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform var(--transition-fast);
}

.darkModeToggle:hover,
.cart:hover,
.profile:hover {
  transform: scale(1.1);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .container {
    flex-wrap: wrap;
    padding: var(--spacing-sm);
  }

  .nav {
    order: 3;
    flex-basis: 100%;
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }

  .actions {
    gap: var(--spacing-sm);
  }

  .themeSelect {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.9rem;
  }
}
```

---

### PHASE 3: Auth System

#### Step 1: Create Auth Store
File: `apps/web/src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@flyfree/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });
          const data = await res.json();
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'fly-free-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
```

#### Step 2: Create Login Page
File: `apps/web/src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className={styles.signup}>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}
```

---

### PHASE 4: Cart System

#### Step 1: Create Cart Store
File: `apps/web/src/store/cartStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@flyfree/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const state = get();
        const existing = state.items.find((i) => i.id === item.id);

        if (existing) {
          set({
            items: state.items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...state.items, item] });
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.total, 0);
      },
    }),
    {
      name: 'fly-free-cart',
    }
  )
);
```

---

### PHASE 5: Product Listing

#### Step 1: Create Product Card Component
File: `apps/web/src/components/product/ProductCard.tsx`

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@flyfree/types';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const discount = product.discountPercent;
  const discountedPrice = Math.round(
    product.price * (1 - discount / 100)
  );

  return (
    <Link href={`/products/${product.slug}`}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          <Image
            src={product.images[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            width={250}
            height={250}
            className={styles.image}
          />
          {discount > 0 && (
            <div className={styles.discount}>{discount}% OFF</div>
          )}
          {product.isTrending && (
            <div className={styles.badge}>Trending</div>
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.price}>
            <span className={styles.discounted}>₹{discountedPrice}</span>
            <span className={styles.original}>₹{product.price}</span>
          </div>

          <div className={styles.rating}>
            ⭐ {product.reviews?.length || 0} reviews
          </div>

          <button className={styles.addToCart}>Add to Cart</button>
        </div>
      </div>
    </Link>
  );
}
```

---

### PHASE 6: Admin Setup

#### Step 1: Create Admin Login Page
File: `apps/admin/src/app/login/page.tsx`

```typescript
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginPage.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Login failed');

      const data = await res.json();
      localStorage.setItem('admin_token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Admin Login</h1>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
```

#### Step 2: Create Admin Dashboard Layout
File: `apps/admin/src/components/common/DashboardLayout.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';
import Sidebar from './Sidebar';
import Header from './Header';

interface Props {
  children: ReactNode;
}

export function DashboardLayout({ children }: Props) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.content}>
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
```

---

### PHASE 7: Admin Product Management

#### Step 1: Create Products Table Component
File: `apps/admin/src/components/tables/ProductsTable.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import styles from './DataTable.module.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  createdAt: string;
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/products?page=${page}&search=${search}`
      );
      const data = await res.json();
      setProducts(data.items);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={styles.search}
        />
        <button className={styles.addBtn}>+ Add Product</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className={styles.loading}>
                Loading...
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className={styles.editBtn}>Edit</button>
                  <button className={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button onClick={() => setPage(Math.max(1, page - 1))}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
```

---

## 📋 Quick Implementation Checklist

### Backend (NestJS)
- [ ] Setup NestJS modules
- [ ] Auth module with Supabase
- [ ] Products module with CRUD
- [ ] Orders module
- [ ] Cart module
- [ ] API routes with error handling
- [ ] Logger setup
- [ ] Environment config

### Frontend (Next.js)
- [ ] Layout with theme provider
- [ ] Header/Footer/Sidebar
- [ ] Login/Signup pages
- [ ] Product listing
- [ ] Product details
- [ ] Cart page
- [ ] Checkout flow
- [ ] User profile
- [ ] Error handling & toasts

### Admin (Next.js)
- [ ] Admin login
- [ ] Dashboard layout
- [ ] Products CRUD with table
- [ ] Orders management
- [ ] User management
- [ ] Analytics dashboard
- [ ] Theme management

### Database
- [ ] Run migrations
- [ ] Seed dummy data (100+ products)
- [ ] Setup Supabase storage

---

## 🔑 Key Commands

```bash
# Start development
npm run dev

# Run migrations
cd services/api
npx prisma migrate dev

# Seed data
npx prisma db seed

# Build
npm run build

# Deploy
npm run deploy
```

---

## 🎨 Design System

### Colors (From CSS Variables)
- Primary: var(--color-primary)
- Secondary: var(--color-secondary)
- Background: var(--color-background)
- Text: var(--color-text)
- Border: var(--color-border)

### Spacing
- xs: 0.25rem
- sm: 0.5rem
- md: 1rem
- lg: 1.5rem
- xl: 2rem

### Border Radius
- sm: 0.25rem
- md: 0.5rem
- lg: 1rem
- xl: 1.5rem
- full: 9999px

### Shadows
- sm, md, lg, xl (predefined)

---

## 🚀 Next Steps

1. **Install dependencies:** `npm install`
2. **Setup .env files** (copy .env.example to .env.local)
3. **Run database migrations:** `npx prisma migrate dev`
4. **Seed dummy data:** `npx prisma db seed`
5. **Start dev servers:** `npm run dev`
6. **Build components incrementally**
7. **Test each phase before moving to next**

---

## 💡 Tips

- Keep components small and focused
- Use TypeScript for type safety
- Separate business logic from UI
- Always handle errors gracefully
- Use toast notifications for feedback
- Test mobile responsiveness
- Use lazy loading for images
- Implement pagination for lists
- Cache API responses
- Log important events

---

## 📚 Documentation

Refer to these for detailed info:
- **ARCHITECTURE.md** - Folder structure
- **packages/types/** - All TypeScript types
- **services/api/prisma/schema.prisma** - Database schema
- **apps/web/src/config/themes.ts** - Theme definitions

---

**Ready to build! 🚀 Start with Phase 1, complete one component at a time, test thoroughly, then move to the next phase.**
