import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CommerceModule } from "./commerce/commerce.module";
import { CmsModule } from "./cms/cms.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CatalogModule,
    CommerceModule,
    CmsModule,
    AdminModule
  ]
})
export class AppModule {}
