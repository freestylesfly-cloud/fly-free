# Fly Free Admin Portal

**Version:** 2026-07-21  
**Status:** Production Ready (v1)  
**Tech Stack:** Next.js 15.5, TypeScript, Tailwind CSS, Zustand, Lucide Icons

---

## Overview

The Fly Free Admin Portal is a comprehensive e-commerce management dashboard for administering products, hampers, themes, orders, users, and customization requests. Built with Next.js and client-side authentication.

---

## Routes & Pages (24 Total)

### Store Management
- **`/`** - Dashboard (metrics, recent orders, analytics)
- **`/products`** - Product list, search, filters
- **`/products/[id]`** - Product detail view
- **`/products/[id]/edit`** - Product editor
- **`/products/new`** - Create new product
- **`/categories`** - Category CRUD (name, slug, image, priority)
- **`/hampers`** - Hamper management (create, edit, assign to products)
- **`/product-themes`** - Product theme collections management

### Orders & Commerce
- **`/orders`** - Order list with status filters
- **`/orders/[id]`** - Order detail, status update, invoice generation
- **`/custom-orders`** - Custom design requests (status, pricing, approval)
- **`/users`** - User list, details, email messaging

### Growth & Engagement
- **`/influencers`** - Influencer management, code generation
- **`/reviews`** - Product reviews (approve, reject, manage)
- **`/notifications`** - System notifications
- **`/email`** - Email campaigns (broadcast, promotional, custom)

### Website & Appearance
- **`/announcements`** - Create hero banners via announcements
- **`/pages`** - Static page content (terms, privacy, etc.)
- **`/website-themes`** - Website appearance (colors, fonts, hero images)
- **`/size-guides`** - Product size measurement tables

### System
- **`/settings`** - Admin settings
- **`/login`** - Authentication
- **`/themes`** - Legacy (website appearance, now moved to website-themes)

---

## Architecture

### Authentication & State
```
Login → Token stored in localStorage → Zustand auth store → 
ProtectedRoute wrapper → Page loads with authenticated context
```

**Auth Store:**
- `useAuthStore` - Manages user, token, login, logout, checkAuth
- Persists to localStorage (flyfree_admin_token, flyfree_admin_user)
- 8-second request timeout with network error detection

### Component Hierarchy
```
RootLayout
├── layout.tsx (metadata, fonts, CSS)
├── DashboardLayout (sidebar + header)
│   ├── Sidebar (navigation menu, logo)
│   ├── AdminHeader (user info, breadcrumb)
│   └── main (content area)
└── ProtectedRoute (auth check wrapper)
```

### API Integration
- **Service:** `apps/admin/app/services/api.ts` (centralized API client)
- **Base URL:** `NEXT_PUBLIC_API_URL` (default: http://localhost:3001)
- **Auth:** Bearer token in Authorization header
- **Error Handling:** User-facing error messages with network diagnostics

### Data Fetching
- **Hook:** `useFetch` (custom hook with retry logic)
- **State:** loading, error, data, refetch
- **Retry Logic:** 1 retry with exponential backoff
- **Timeout:** 8 seconds per request

---

## Key Features Implemented

### ✅ Products
- CRUD operations with variants (color × size × price)
- Product images per color
- Inventory tracking
- Visibility toggle (enable/disable product)
- Search and filters

### ✅ Hampers (NEW)
- Create optional add-ons for products
- Multiple images per hamper
- Contents list (line-separated)
- Pricing separate from product
- GST calculation
- Product assignment
- Professional 2-panel UI (list + form)

### ✅ Size Guides
- Create measurement tables (S/M/L/XL)
- Display sizes with chest, shoulder, length, sleeve
- Active/inactive toggle
- Priority ordering

### ✅ Categories
- CRUD operations
- Product count display
- Search and filtering
- Professional management UI

### ✅ Orders Management
- List with status filtering (PLACED, CONFIRMED, SHIPPED, DELIVERED)
- Order details view
- Status updates with history
- Invoice generation
- Customer information

### ✅ Authentication
- Email + password login
- Token-based (8-day expiry)
- Remember session
- Logout with redirect
- Protected routes
- Network error messages

### ✅ UI/UX
- Professional retro-bold design
- Responsive (mobile + desktop)
- Sidebar navigation (collapsible on mobile)
- Search/filter on most pages
- Error/success notifications
- Loading states
- Consistent color scheme (Ink, Paper, Mint, Coral)

---

## Data Flow Examples

### Creating a Product
```
Admin fills form → Submit → apiService.createProduct() → 
POST /api/admin/products → Backend creates → 
Refresh list → Show success notification
```

### Assigning Hamper to Product
```
Open Hamper Manager → Select product → Fill hamper details → 
Submit → POST /api/admin/hampers → Hamper created → 
Can assign to multiple products → Shows in product variants
```

### Custom Design Request Workflow
```
User submits design → Admin sees in /custom-orders → 
Review images → Set quoted price → User gets notified → 
User pays → Order created → Admin marks IN_PRODUCTION → 
User notified when COMPLETED
```

---

## What Works ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ | Login/logout working, token persistence |
| Dashboard | ✅ | Shows metrics, recent orders |
| Products CRUD | ✅ | Full create/edit/delete with images |
| Categories CRUD | ✅ | Complete management |
| Hampers CRUD | ✅ | Create, edit, delete, assign to products |
| Orders | ✅ | List, view, update status, invoice |
| Users | ✅ | List, view details, send email |
| Reviews | ✅ | Approve/reject, manage |
| Size Guides | ✅ | CRUD for measurement tables |
| Influencers | ✅ | Manage codes and referrals |
| Notifications | ✅ | List and mark as read |
| Website Themes | ✅ | Color scheme, fonts, hero setup |
| Announcements | ✅ | Create hero banners |
| Pages | ✅ | Static content management |
| Responsive Design | ✅ | Mobile + desktop working |
| Error Handling | ✅ | User-friendly messages |

---

## What Needs More Work ⏳

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Product Variants UI | ⏳ | HIGH | Need comprehensive variant editor (color/size/price combos) |
| Bulk Actions | ❌ | MEDIUM | Bulk edit, bulk delete for products |
| Image Upload | ⏳ | HIGH | Drag-drop image upload instead of just URLs |
| Inventory Management | ⏳ | MEDIUM | Stock tracking UI, low-stock alerts |
| Email Templates | ❌ | MEDIUM | Visual email template builder |
| Analytics Dashboard | ⏳ | MEDIUM | Charts, trends, detailed metrics |
| Discount Management | ❌ | MEDIUM | Create/manage discounts, coupons |
| Payment Settings | ❌ | HIGH | Razorpay configuration in admin |
| Role-Based Access | ⏳ | MEDIUM | Permission system (currently all admins have same access) |
| Audit Logs | ❌ | LOW | Track admin actions |
| Batch Operations | ❌ | MEDIUM | Import products, export data |
| Advanced Filters | ⏳ | MEDIUM | Multi-criteria filtering on product list |
| Webhooks | ❌ | LOW | Send events to external systems |

---

## Code Style & Patterns

### Component Structure
```typescript
'use client';  // Always mark client components

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function PageName() {
  // All logic here
  return (
    <ProtectedRoute>
      <DashboardLayout title="Page Title" subtitle="Subtitle">
        {/* Content */}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

### Form Patterns
```typescript
const [formData, setFormData] = useState<FormType>(emptyForm);
const [error, setError] = useState('');
const [notice, setNotice] = useState('');
const [saving, setSaving] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSaving(true);
  try {
    await apiService.saveItem(formData);
    setNotice('Saved successfully.');
    await loadData();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error');
  } finally {
    setSaving(false);
  }
}
```

### Styling
- Tailwind CSS with custom colors: `bg-ink`, `text-paper`, `border-black/10`
- Responsive: `md:` breakpoint for desktop
- Icons: Lucide React (`lucide-react`)
- Transitions: `transition duration-200` for smooth UI

---

## Environment Variables

```env
# Required in apps/admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Running Locally

```bash
# Terminal 1: Start API
cd services/api && npm run start

# Terminal 2: Start Admin
cd apps/admin && npm run dev

# Access at http://localhost:3002
# Login: test admin credentials from seeding
```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance

- First Load JS: ~119-188 kB (varies by page)
- Middleware: 34.3 kB
- Build time: ~9 seconds
- Route count: 24 total
- Static routes: 16
- Dynamic routes: 8

---

## Security

- ✅ Protected routes (ProtectedRoute wrapper)
- ✅ Bearer token authentication
- ✅ localStorage session persistence
- ✅ 8-second request timeout
- ⏳ Role-based access control (TODO)
- ⏳ Audit logging (TODO)

---

## Testing

- Unit tests: None yet
- E2E tests: None yet
- Manual testing: All routes verified

---

## Known Issues

1. **Metadata Viewport Warnings** - Next.js deprecation warnings about viewport in metadata (non-critical)
2. **Module Resolution** - Some @apply circular dependencies in older CSS (fixed)
3. **Build Cache** - Occasionally requires `rm -rf .next` to clear cache

---

## Next Steps

1. Build product variant editor UI
2. Add image upload component
3. Implement role-based access control
4. Create analytics dashboard
5. Add bulk operations support
6. Build email template designer
7. Implement Razorpay payment settings

