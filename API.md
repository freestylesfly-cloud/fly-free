# Fly Free API

**Version:** 2026-07-21  
**Status:** Production Ready (v1)  
**Tech Stack:** NestJS, TypeScript, Prisma ORM, PostgreSQL (Neon)

---

## Overview

The Fly Free API is a RESTful backend service providing e-commerce operations, product management, order processing, custom designs, and admin functionality. Built with NestJS for scalability and type safety.

**Base URL:** `http://localhost:3001`  
**Authentication:** Bearer Token (JWT-like, 7-day expiry)

---

## Architecture

### Folder Structure
```
services/api/src/
├── admin/              # Admin operations (products, orders, users)
├── auth/               # Authentication (login, logout, verify)
├── catalog/            # Product browsing (public)
├── cms/                # Website content (home page, announcements)
├── custom/             # Custom design requests
├── email/              # Email service
├── ecommerce/          # Shopping (cart, orders, checkout)
├── influencer/         # Referral program
├── theme/              # Website themes, announcements
├── review/             # Product reviews
├── prisma/             # Database schema + migrations
├── app.module.ts       # Root module
└── main.ts             # Entry point
```

### Authentication Flow
```
POST /api/auth/admin/login (email + password) →
Response: { token, user } →
Client stores token in localStorage →
Subsequent requests: Authorization: Bearer {token}
```

### Database Schema
**Key Models:**
- User (customers)
- AdminUser (with roles)
- Product (with variants, images, hampers)
- ProductVariant (size × color × price)
- ProductHamper (optional gift box add-ons)
- ProductImage (product gallery)
- Order (with items and payment)
- CustomizationRequest (design requests)
- Influencer (referral program)
- Theme (product themes like Anime, Puja)
- SizeGuide (measurement tables)
- And 20+ more supporting models

**Total Migrations:** 30+  
**Database Provider:** PostgreSQL (Neon cloud)

---

## API Endpoints by Module

### Authentication (`/api/auth`)
```
POST   /auth/admin/login           Login admin user
POST   /auth/admin/logout          Logout admin user
GET    /auth/admin/profile         Get current admin profile
GET    /auth/verify-email          Verify email token
POST   /auth/forgot-password       Request password reset
```

### Admin - Products (`/api/admin`)
```
GET    /products                   List products (paginated)
GET    /products/:id               Get product detail
POST   /products                   Create product
PUT    /products/:id               Update product
DELETE /products/:id               Delete product
POST   /products/:id/images        Upload product image
DELETE /products/:id/images/:imageId Delete image
```

### Admin - Variants
```
GET    /products/:id/variants      List product variants
POST   /products/:id/variants      Create variant
PUT    /variants/:id               Update variant pricing/stock
DELETE /variants/:id               Delete variant
```

### Admin - Hampers
```
GET    /hampers                    List all hampers
POST   /hampers                    Create hamper
PUT    /hampers/:id                Update hamper
DELETE /hampers/:id                Delete hamper
```

### Admin - Orders (`/api/admin`)
```
GET    /orders                     List orders (with filters)
GET    /orders/:id                 Get order detail
PUT    /orders/:id/status          Update order status
POST   /orders/:id/send-invoice    Email invoice
```

### Admin - Users
```
GET    /users                      List users
GET    /users/:id                  Get user detail
POST   /users/:id/email            Send email to user
```

### Admin - Categories
```
GET    /categories                 List categories
POST   /categories                 Create category
PUT    /categories/:id             Update category
DELETE /categories/:id             Delete category
```

### Admin - Themes
```
GET    /admin/product-themes       List product themes
POST   /admin/product-themes       Create theme
PUT    /admin/product-themes/:id   Update theme
DELETE /admin/product-themes/:id   Delete theme

GET    /admin/website-themes       List website themes
POST   /admin/website-themes       Create website theme
PUT    /admin/website-themes/:id   Update website theme
DELETE /admin/website-themes/:id   Delete website theme
```

### Admin - Size Guides
```
GET    /admin/size-guides          List size guides
POST   /admin/size-guides          Create size guide
PUT    /admin/size-guides/:id      Update size guide
DELETE /admin/size-guides/:id      Delete size guide
```

### Admin - Reviews
```
GET    /admin/reviews              List reviews
PATCH  /admin/reviews/:id          Approve/reject review
```

### Admin - Influencers
```
GET    /admin/influencers          List influencers
POST   /admin/influencers          Create influencer
PUT    /admin/influencers/:id      Update influencer
DELETE /admin/influencers/:id      Delete influencer
POST   /admin/influencers/:id/send-code Send referral code
```

### Catalog - Products (Public)
```
GET    /catalog/products           List products (public)
GET    /catalog/products/:slug     Get product detail
GET    /catalog/categories         List categories
GET    /catalog/themes             List themes
GET    /catalog/collections        List collections
```

### E-Commerce (`/api/ecommerce`)
```
GET    /cart                       Get user cart
POST   /cart/items                 Add item to cart
PUT    /cart/items/:itemId         Update cart item
DELETE /cart/items/:itemId         Remove from cart
POST   /checkout                   Process checkout
GET    /orders                     Get user's orders
GET    /orders/:id                 Get order detail
```

### Custom Design (`/api/custom`)
```
GET    /custom-designs             Get user's designs
POST   /custom-designs             Submit design request
GET    /custom-designs/:id         Get design detail
PATCH  /custom-designs/:id/status  Update design status

GET    /admin/custom-designs       Admin: List all requests
PATCH  /admin/custom-designs/:id/quote Set price quote
```

### Reviews (`/api/review`)
```
GET    /products/:id/reviews       Get product reviews
POST   /products/:id/reviews       Create review
DELETE /reviews/:id                Delete review
```

### CMS (`/api/cms`)
```
GET    /home                       Get home page content
GET    /pages/:slug                Get static page
```

### Theme (`/api/theme`)
```
GET    /themes                     List active themes
GET    /themes/:slug               Get theme detail
```

### Analytics (`/api/admin/analytics`)
```
GET    /analytics/dashboard        Dashboard metrics
GET    /analytics/sales            Sales analytics
GET    /analytics/revenue          Revenue analytics
GET    /analytics/orders           Order analytics
```

### Email (`/api/admin/email`)
```
GET    /email/stats                Email campaign stats
POST   /email/send-broadcast       Send broadcast email
POST   /email/send-promotional     Send promotional email
POST   /email/send-invite          Send invite email
POST   /email/send-user-message    Send custom message
```

---

## Common Response Format

### Success Response
```json
{
  "data": { /* response payload */ },
  "message": "Operation successful",
  "statusCode": 200
}
```

### Error Response
```json
{
  "error": "Error message describing the issue",
  "statusCode": 400,
  "message": "Validation failed"
}
```

### Paginated Response
```json
{
  "data": [ /* items */ ],
  "page": 1,
  "limit": 10,
  "total": 150,
  "totalPages": 15,
  "hasMore": true
}
```

---

## Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Filtering
- `search` - Text search on name/description
- `status` - Filter by status (for orders)
- `category` - Category ID
- `theme` - Theme ID
- `collection` - Collection ID

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - 'asc' or 'desc'

---

## Authentication Headers

All authenticated endpoints require:
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## What Works ✅

| Module | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ | Login, logout, profile |
| Products CRUD | ✅ | Create, read, update, delete |
| Variants | ✅ | Size/color/price combinations |
| Hampers | ✅ | Create, manage, assign to products |
| Orders | ✅ | List, detail, status updates |
| Users | ✅ | List, search, email messaging |
| Categories | ✅ | Full CRUD |
| Themes | ✅ | Product & website themes |
| Size Guides | ✅ | Measurement management |
| Reviews | ✅ | List, create, approve/reject |
| Influencers | ✅ | Referral program management |
| Cart | ✅ | Add/remove items, view cart |
| Custom Designs | ✅ | Submit, quote, status tracking |
| CMS | ✅ | Home page, static pages |
| Email | ✅ | Broadcast, promotional, custom |
| Analytics | ✅ | Dashboard, sales, revenue |
| Catalog (Public) | ✅ | Browse products, categories |

---

## What Needs More Work ⏳

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Checkout Flow | ⏳ | CRITICAL | Payment integration incomplete |
| Razorpay Integration | ⏳ | CRITICAL | Payment processing needs setup |
| Image Upload | ⏳ | HIGH | Current: URL only, need multipart upload |
| Inventory Management | ⏳ | HIGH | Stock levels, low-stock alerts |
| Discount System | ⏳ | HIGH | Coupon validation, code application |
| Email Templates | ⏳ | MEDIUM | Dynamic template rendering |
| Wishlist API | ⏳ | MEDIUM | Save/unsave products |
| Cart Persistence | ⏳ | MEDIUM | Database-backed carts (currently client-side) |
| Search Enhancement | ⏳ | MEDIUM | Full-text search indexing |
| Rate Limiting | ❌ | MEDIUM | Prevent abuse, API throttling |
| Webhooks | ❌ | LOW | External system notifications |
| Batch Operations | ❌ | LOW | Bulk product import/export |
| Async Jobs | ⏳ | MEDIUM | Background task processing |
| Caching | ⏳ | LOW | Redis caching for hot queries |
| API Documentation | ⏳ | MEDIUM | Swagger/OpenAPI spec |
| Audit Logging | ❌ | LOW | Track admin actions |

---

## Database Schema Highlights

### Key Relationships
```
User
├─ Orders (one-to-many)
├─ Wishlist (one-to-many)
├─ Addresses (one-to-many)
├─ CustomizationRequest (one-to-many)
└─ Reviews (one-to-many)

Product
├─ ProductImage (one-to-many)
├─ ProductVariant (one-to-many)
│  └─ Inventory (one-to-one)
├─ ProductHamper (one-to-many)
├─ Review (one-to-many)
├─ Category (many-to-one)
├─ Theme (many-to-one)
└─ Collection (many-to-one)

Order
├─ OrderItem (one-to-many)
├─ Payment (one-to-one)
├─ Invoice (one-to-one)
└─ OrderStatusHistory (one-to-many)
```

### Enums
- `Gender`: MEN, WOMEN, UNISEX
- `OrderStatus`: PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- `PaymentStatus`: PENDING, PAID, FAILED, REFUNDED
- `ReviewStatus`: PENDING, APPROVED, REJECTED
- `CustomizationStatus`: REQUESTED, APPROVED, REJECTED, PAID, IN_PRODUCTION, COMPLETED

---

## Error Codes

```
400 - Bad Request        (validation failed)
401 - Unauthorized       (missing/invalid token)
403 - Forbidden          (insufficient permissions)
404 - Not Found          (resource not found)
409 - Conflict           (duplicate entry, constraint violation)
500 - Server Error       (unexpected error)
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@flyfree.com

# Payment
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# API
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

---

## Performance Metrics

- Average response time: <500ms for most endpoints
- Database query optimization: Indexed on frequently-queried fields
- Pagination: Default 10 items/page, max 100
- Request timeout: 30 seconds
- Rate limiting: None yet (TODO)

---

## Security

- ✅ JWT Bearer token authentication
- ✅ CORS enabled for web/admin domains
- ✅ SQL injection protection (Prisma ORM)
- ✅ Input validation on all endpoints
- ✅ HTTPS ready
- ⏳ Rate limiting (TODO)
- ⏳ API key authentication (TODO)
- ⏳ OAuth2 integration (TODO)

---

## Running Locally

```bash
# Start API server
cd services/api
npm run start

# Watch mode for development
npm run dev

# Seed database with demo data
npm run db:seed

# Run migrations
npx prisma migrate dev
```

---

## Testing

- Unit tests: Partial (models and services)
- Integration tests: None yet
- E2E tests: None yet
- Manual testing: All main endpoints verified

---

## Deployment

- **Provider:** Ready for AWS/GCP/Azure
- **Database:** Neon PostgreSQL (cloud)
- **Authentication:** Bearer tokens, 7-day expiry
- **Email:** SMTP configuration required
- **Payment:** Razorpay merchant account required
- **Scaling:** Stateless design, can scale horizontally

---

## Code Style & Patterns

### Module Structure
```typescript
// *.module.ts
@Module({
  imports: [/* dependencies */],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

### Service Pattern
```typescript
@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }
}
```

### Controller Pattern
```typescript
@Controller('admin/products')
export class AdminProductController {
  constructor(private service: ProductService) {}

  @Post()
  create(@Body() data: CreateProductDto) {
    return this.service.createProduct(data);
  }
}
```

---

## API Documentation

- **Base URL:** http://localhost:3001
- **Version:** v1 (implicit, no version prefix in URLs)
- **Swagger docs:** Not yet available (TODO)
- **PostMan collection:** Not available (TODO)

---

## Next Steps (Priority)

1. **Implement checkout** - Complete payment flow
2. **Razorpay integration** - Payment processing
3. **Image upload** - Multipart file upload endpoint
4. **Cart persistence** - Move from client to database
5. **Discount system** - Coupon validation and application
6. **Rate limiting** - Prevent abuse
7. **Full-text search** - Enhanced product search
8. **Background jobs** - Email processing, order notifications
9. **API documentation** - Swagger/OpenAPI
10. **Audit logging** - Admin action tracking

---

## Known Issues

1. **No image upload endpoint** - Currently accepts URL only
2. **Cart not persistent** - Lives in client localStorage
3. **No checkout payment flow** - Razorpay not integrated yet
4. **No rate limiting** - Could be abused
5. **No caching** - Every request hits database
6. **Email templates basic** - No dynamic rendering

---

## Dependencies

**Core:**
- NestJS 10.x
- TypeScript 5.x
- Prisma 5.x

**Database:**
- PostgreSQL 14+
- Neon (cloud provider)

**Authentication:**
- bcrypt (password hashing)
- JWT-like tokens

**Email:**
- Nodemailer
- SMTP

**Payment:**
- Razorpay SDK

**Utilities:**
- class-validator
- class-transformer
- axios (HTTP client)

