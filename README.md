# Fly Free Platform

Modern monorepo foundation for rebuilding Fly Free from a static landing page into a full e-commerce platform.

## Structure

```txt
apps/
  web/       Customer storefront, Next.js App Router
  admin/     Admin panel, Next.js App Router
services/
  api/       NestJS + Fastify API with Prisma
packages/
  ui/        Shared React components
  types/     Shared TypeScript contracts
  utils/     Shared helpers
  config/    Shared app config
```

## First Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Default ports:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000/api`

## Next Build Steps

1. Connect PostgreSQL and run the first Prisma migration.
2. Add authentication for users and admins.
3. Replace mock storefront/admin data with API calls.
4. Implement product CRUD, image upload to Cloudflare R2, and Razorpay checkout.
5. Add guest cart and wishlist merge on login.
6. Build the custom design request workflow.
