import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function shouldRateLimit(pathname: string) {
  return [
    /^\/api\/auth\/user\/login$/,
    /^\/api\/auth\/admin\/login$/,
    /^\/api\/auth\/user\/signup$/,
    /^\/api\/auth\/user\/verify-email$/,
    /^\/api\/auth\/user\/resend-email$/,
    /^\/api\/auth\/user\/resend-otp$/,
    /^\/api\/auth\/forgot-password$/,
    /^\/api\/auth\/user\/forgot-password$/,
    /^\/api\/auth\/reset-password$/,
    /^\/api\/auth\/user\/reset-password$/,
    /^\/api\/commerce\/checkout$/,
    /^\/api\/commerce\/checkout\/verify$/
  ].some((pattern) => pattern.test(pathname));
}

function rateLimitMax(pathname: string) {
  if (pathname.includes("/checkout")) return 20;
  if (pathname.includes("resend") || pathname.includes("forgot-password") || pathname.includes("reset-password")) return 5;
  return 10;
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 30 * 1024 * 1024 })
  );
  // Extra origins can be added per-environment without a code change:
  // CORS_ORIGINS="https://staging.example.com,https://other.example.com"
  const extraCorsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultCorsOrigins: Array<string | RegExp> = [
    // Local Development
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    // Production custom domains
    "https://flyfree.co.in",
    "https://www.flyfree.co.in",
    "https://admin.flyfree.co.in",
    // Vercel default hostnames, kept as a fallback while DNS is switching over
    "https://fly-free-web.vercel.app",
    "https://fly-free-admin.vercel.app",
    // Preview deployments of THESE projects only. A bare `.*\.vercel\.app`
    // would let any Vercel app on the internet call this API with credentials.
    /^https:\/\/fly-free-(web|admin)-[a-z0-9-]+\.vercel\.app$/,
    ...extraCorsOrigins
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl requests, etc)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in the allowed list
      const allowed = defaultCorsOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (allowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onRequest", (request: any, reply: any, done: any) => {
    const method = String(request.method || "").toUpperCase();
    const pathname = String(request.url || "").split("?")[0];

    if (method !== "POST" || !shouldRateLimit(pathname)) {
      done();
      return;
    }

    const forwardedFor = String(request.headers?.["x-forwarded-for"] || "");
    const ip = forwardedFor.split(",")[0].trim() || request.ip || request.socket?.remoteAddress || "unknown";
    const key = `${ip}:${pathname}`;
    const now = Date.now();
    const current = rateLimitBuckets.get(key);
    const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);

    if (bucket.count > rateLimitMax(pathname)) {
      reply
        .code(429)
        .header("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)))
        .send({ statusCode: 429, message: "Too many attempts. Please try again shortly." });
      return;
    }

    done();
  });

  // Swagger Documentation (like Python's Swagger/OpenAPI)
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    const config = new DocumentBuilder()
    .setTitle("Fly Free API")
    .setDescription("E-commerce API for t-shirt customization platform with admin dashboard")
    .setVersion("1.0.0")
    .addTag("🔐 Authentication", "User & Admin login, signup, email verification, password reset")
    .addTag("📦 Catalog", "Browse products, get details, view collections")
    .addTag("🛍️ Commerce", "Checkout, order creation, payment verification")
    .addTag("👤 User Profile", "Get/update user profile, change password, logout")
    .addTag("🛒 Shopping Cart", "Add/remove items, view cart, update quantities")
    .addTag("❤️ Wishlist", "Add/remove wishlist items, view favorites")
    .addTag("⭐ Reviews", "Create/read/update/delete product reviews")
    .addTag("📍 Addresses", "Manage delivery addresses")
    .addTag("📦 Orders", "View orders, track status, download invoices")
    .addTag("🎟️ Coupons", "Get coupon details, apply discounts")
    .addTag("📰 CMS", "Home page, announcements, themes, pages")
    .addTag("👨‍💼 Admin Products", "CRUD operations for products")
    .addTag("📋 Admin Orders", "Manage orders, update status, send invoices")
    .addTag("👥 Admin Users", "Manage users, view profiles")
    .addTag("🎨 Admin Themes", "Create, update, activate themes")
    .addTag("📣 Admin Announcements", "Create, update, delete announcements")
    .addTag("⚙️ Admin Settings", "Manage app settings and configuration")
    .addTag("📊 Admin Analytics", "Dashboard stats, sales, revenue reports")
    .addTag("📧 Email", "Send emails, notifications, invoices")
    .addTag("📊 Admin Logs", "View server logs and system status")
    .addBearerAuth()
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`\n✅ API Server running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    console.log(`📚 API Docs available at: http://localhost:${port}/docs\n`);
  }
}

void bootstrap();
