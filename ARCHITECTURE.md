# Fly Free - Architecture & Folder Structure

## Monorepo Structure

```
flyfree-platform/
├── apps/
│   ├── web/                          # User-facing storefront (Next.js SPA)
│   │   ├── src/
│   │   │   ├── app/                  # Next.js app router
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   ├── page.tsx          # Home page
│   │   │   │   ├── (auth)/           # Auth routes group
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── signup/
│   │   │   │   │   └── callback/
│   │   │   │   ├── (shop)/           # Shopping routes group
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── [slug]/       # Product detail
│   │   │   │   │   └── cart/
│   │   │   │   ├── (user)/           # Protected user routes
│   │   │   │   │   ├── profile/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── wishlist/
│   │   │   │   │   ├── addresses/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   └── settings/
│   │   │   │   ├── (checkout)/       # Checkout flow
│   │   │   │   │   ├── address/
│   │   │   │   │   ├── shipping/
│   │   │   │   │   ├── payment/
│   │   │   │   │   └── confirmation/
│   │   │   │   ├── designer/         # Custom t-shirt designer
│   │   │   │   ├── referral/         # Referral page
│   │   │   │   └── error.tsx
│   │   │   ├── components/
│   │   │   │   ├── common/           # Shared UI components
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── MobileNav.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Loader.tsx
│   │   │   │   │   └── SkeletonLoader.tsx
│   │   │   │   ├── product/
│   │   │   │   │   ├── ProductCard.tsx
│   │   │   │   │   ├── ProductGrid.tsx
│   │   │   │   │   ├── ProductDetail.tsx
│   │   │   │   │   ├── ColorSelector.tsx
│   │   │   │   │   ├── SizeChart.tsx
│   │   │   │   │   └── ReviewSection.tsx
│   │   │   │   ├── cart/
│   │   │   │   │   ├── CartItem.tsx
│   │   │   │   │   ├── CartSummary.tsx
│   │   │   │   │   └── CartDrawer.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── SignupForm.tsx
│   │   │   │   │   └── AuthGuard.tsx
│   │   │   │   ├── checkout/
│   │   │   │   │   ├── AddressForm.tsx
│   │   │   │   │   ├── ShippingOptions.tsx
│   │   │   │   │   ├── PaymentForm.tsx
│   │   │   │   │   └── OrderSummary.tsx
│   │   │   │   └── designer/
│   │   │   │       ├── Canvas.tsx
│   │   │   │       ├── ToolBar.tsx
│   │   │   │       └── Preview.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useCart.ts
│   │   │   │   ├── useTheme.ts
│   │   │   │   ├── useProduct.ts
│   │   │   │   └── useToast.ts
│   │   │   ├── store/                # Zustand stores
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── cartStore.ts
│   │   │   │   ├── themeStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   ├── services/             # API/Business logic
│   │   │   │   ├── api/
│   │   │   │   │   ├── products.ts
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── orders.ts
│   │   │   │   │   ├── cart.ts
│   │   │   │   │   └── payment.ts
│   │   │   │   ├── supabase.ts       # Supabase client
│   │   │   │   └── storage.ts        # Image uploads
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   ├── variables.css     # CSS variables for themes
│   │   │   │   └── animations.css
│   │   │   ├── types/                # TypeScript types
│   │   │   │   ├── index.ts
│   │   │   │   ├── product.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── order.ts
│   │   │   │   └── theme.ts
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts             # classname utility
│   │   │   │   ├── format.ts         # Number, date formatting
│   │   │   │   ├── validation.ts
│   │   │   │   └── logger.ts
│   │   │   ├── config/
│   │   │   │   ├── themes.ts         # Theme definitions
│   │   │   │   ├── constants.ts
│   │   │   │   └── env.ts
│   │   │   ├── middleware.ts
│   │   │   └── providers.tsx         # Global providers (Theme, Toast, etc)
│   │   ├── public/
│   │   │   ├── images/
│   │   │   │   ├── logo.png
│   │   │   │   ├── hero/
│   │   │   │   └── icons/
│   │   │   └── fonts/
│   │   ├── .env.local
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── admin/                        # Admin dashboard (Next.js)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx          # Dashboard
│       │   │   ├── login/            # Admin login (separate)
│       │   │   ├── (dashboard)/      # Protected routes
│       │   │   │   ├── products/     # CRUD operations
│       │   │   │   ├── orders/
│       │   │   │   ├── users/
│       │   │   │   ├── reviews/
│       │   │   │   ├── designs/      # Custom design requests
│       │   │   │   ├── themes/       # Manage themes
│       │   │   │   ├── analytics/
│       │   │   │   ├── influencers/  # Referral management
│       │   │   │   ├── settings/
│       │   │   │   └── banners/
│       │   │   └── error.tsx
│       │   ├── components/
│       │   │   ├── common/
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── DashboardLayout.tsx
│       │   │   │   └── Toast.tsx
│       │   │   ├── tables/
│       │   │   │   ├── DataTable.tsx (reusable)
│       │   │   │   ├── ProductsTable.tsx
│       │   │   │   ├── OrdersTable.tsx
│       │   │   │   ├── UsersTable.tsx
│       │   │   │   └── DesignTable.tsx
│       │   │   ├── forms/
│       │   │   │   ├── ProductForm.tsx
│       │   │   │   ├── ThemeForm.tsx
│       │   │   │   └── BannerForm.tsx
│       │   │   ├── modals/
│       │   │   │   ├── ConfirmModal.tsx
│       │   │   │   ├── EditModal.tsx
│       │   │   │   └── UploadModal.tsx
│       │   │   └── charts/
│       │   │       ├── SalesChart.tsx
│       │   │       ├── RevenueChart.tsx
│       │   │       └── VisitorsChart.tsx
│       │   ├── hooks/
│       │   │   ├── useAdminAuth.ts
│       │   │   ├── useTable.ts       # Reusable table logic
│       │   │   └── useForm.ts
│       │   ├── store/
│       │   │   └── adminStore.ts
│       │   ├── services/
│       │   │   ├── api/
│       │   │   │   ├── admin.ts
│       │   │   │   ├── products.ts
│       │   │   │   ├── orders.ts
│       │   │   │   └── analytics.ts
│       │   │   └── supabase.ts
│       │   ├── types/
│       │   │   └── admin.ts
│       │   ├── utils/
│       │   │   └── admin.ts
│       │   ├── styles/
│       │   │   └── admin.css
│       │   └── providers.tsx
│       ├── .env.local
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── services/
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── main.ts               # Entry point
│       │   ├── app.module.ts         # Root module
│       │   ├── common/
│       │   │   ├── filters/          # Exception filters
│       │   │   │   └── http.filter.ts
│       │   │   ├── guards/           # Auth guards
│       │   │   │   ├── jwt.guard.ts
│       │   │   │   └── admin.guard.ts
│       │   │   ├── interceptors/     # Logging, etc
│       │   │   │   ├── logging.interceptor.ts
│       │   │   │   └── transform.interceptor.ts
│       │   │   ├── middleware/
│       │   │   │   └── cors.middleware.ts
│       │   │   └── pipes/
│       │   │       └── validation.pipe.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── strategies/
│       │   │   │   └── jwt.strategy.ts
│       │   │   └── dto/
│       │   │       ├── login.dto.ts
│       │   │       └── signup.dto.ts
│       │   ├── products/
│       │   │   ├── products.module.ts
│       │   │   ├── products.service.ts
│       │   │   ├── products.controller.ts
│       │   │   └── dto/
│       │   ├── orders/
│       │   │   ├── orders.module.ts
│       │   │   ├── orders.service.ts
│       │   │   ├── orders.controller.ts
│       │   │   └── dto/
│       │   ├── cart/
│       │   │   ├── cart.module.ts
│       │   │   ├── cart.service.ts
│       │   │   ├── cart.controller.ts
│       │   │   └── dto/
│       │   ├── payments/
│       │   │   ├── payments.module.ts
│       │   │   ├── payments.service.ts
│       │   │   ├── razorpay.service.ts
│       │   │   ├── payments.controller.ts
│       │   │   └── dto/
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.controller.ts
│       │   │   └── dto/
│       │   ├── reviews/
│       │   │   ├── reviews.module.ts
│       │   │   ├── reviews.service.ts
│       │   │   └── reviews.controller.ts
│       │   ├── designs/             # Custom t-shirt designs
│       │   │   ├── designs.module.ts
│       │   │   ├── designs.service.ts
│       │   │   └── designs.controller.ts
│       │   ├── referrals/           # Affiliate/referral system
│       │   │   ├── referrals.module.ts
│       │   │   ├── referrals.service.ts
│       │   │   └── referrals.controller.ts
│       │   ├── themes/              # Theme management
│       │   │   ├── themes.module.ts
│       │   │   ├── themes.service.ts
│       │   │   └── themes.controller.ts
│       │   ├── analytics/
│       │   │   ├── analytics.module.ts
│       │   │   ├── analytics.service.ts
│       │   │   └── analytics.controller.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts
│       │   ├── config/
│       │   │   └── configuration.ts
│       │   └── utils/
│       │       ├── logger.ts
│       │       └── validators.ts
│       ├── prisma/
│       │   ├── schema.prisma        # Database schema
│       │   ├── seed.ts              # Seed data
│       │   └── migrations/
│       ├── .env.local
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── product.ts
│   │   │   ├── user.ts
│   │   │   ├── order.ts
│   │   │   ├── theme.ts
│   │   │   ├── api.ts
│   │   │   └── database.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                          # Shared UI components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...other primitives
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/                       # Shared utilities
│   │   ├── src/
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   └── logger.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── test.yml
├── docker-compose.yml
├── README.md
└── turbo.json
```

---

## Key Principles

### 1. **Separation of Concerns**
- Business logic in `services/`
- UI only in `components/`
- State management in `store/`
- API calls in `services/api/`

### 2. **No Inline CSS**
- Use Tailwind classes in components
- CSS variables in `styles/variables.css` for theme
- CSS modules for complex styles

### 3. **Proper Typing**
- All types in `packages/types/`
- Shared across frontend + backend

### 4. **Error Handling**
- Try-catch in services
- Toast notifications for UI feedback
- Logger utility for debugging

### 5. **Code Organization**
- Features in their own folders
- Reusable logic in hooks/stores
- Utils for pure functions

---

## Development Workflow

1. Create feature folder
2. Add types in `packages/types/`
3. Create service (business logic)
4. Create components (UI)
5. Connect with hooks/store
6. Test error cases
7. Add loading states
8. Show toast notifications

---

## Starting Points

### Week 1: Database + Auth + Shell
- [ ] Prisma schema
- [ ] Supabase auth setup
- [ ] Header/Footer/Sidebar components
- [ ] Theme system
- [ ] Admin login

### Week 2: Admin Panel
- [ ] Dashboard
- [ ] Product CRUD
- [ ] Data tables with search/pagination
- [ ] Upload images

### Week 3: User Shopping
- [ ] Product listing
- [ ] Search & filters
- [ ] Cart management
- [ ] Checkout flow

### Week 4: Advanced Features
- [ ] Razorpay integration
- [ ] Reviews & ratings
- [ ] Custom designer
- [ ] Referral system
