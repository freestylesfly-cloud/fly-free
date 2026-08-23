import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CommerceModule } from "./commerce/commerce.module";
import { CmsModule } from "./cms/cms.module";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { EmailModule } from "./email/email.module";
import { LoggerModule } from "./logger/logger.module";
import { InstagramModule } from "./instagram/instagram.module";
import { ReviewModule } from "./review/review.module";
import { InfluencerModule } from "./influencer/influencer.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "services/api/.env.local", "services/api/.env"]
    }),
    PrismaModule,
    CatalogModule,
    CommerceModule,
    CmsModule,
    AdminModule,
    AuthModule,
    EmailModule,
    LoggerModule,
    InstagramModule,
    ReviewModule,
    InfluencerModule,
    AnalyticsModule
  ]
})
export class AppModule {}
