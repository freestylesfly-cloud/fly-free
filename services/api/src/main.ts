import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger Documentation (like Python's Swagger/OpenAPI)
  const config = new DocumentBuilder()
    .setTitle("Fly Free API")
    .setDescription("E-commerce API for t-shirt customization platform with admin dashboard")
    .setVersion("1.0.0")
    .addTag("Catalog", "Product management endpoints")
    .addTag("Commerce", "Order and checkout endpoints")
    .addTag("CMS", "Content management endpoints")
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
