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
import { CustomDesignModule } from "./custom-design/custom-design.module";
import { WebsiteThemeModule } from "./theme/website-theme.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CatalogModule,
    CommerceModule,
    CmsModule,
    AdminModule,
    AuthModule,
    EmailModule,
    LoggerModule,
    CustomDesignModule,
    WebsiteThemeModule
  ]
})
export class AppModule {}
