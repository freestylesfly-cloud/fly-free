import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const defaultCorsOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002"
  ];

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? defaultCorsOrigins,
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger Documentation (like Python's Swagger/OpenAPI)
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

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`\n✅ API Server running on: http://localhost:${port}`);
  console.log(`📚 API Docs available at: http://localhost:${port}/docs\n`);
}

void bootstrap();
