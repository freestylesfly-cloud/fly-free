import { Module } from "@nestjs/common";
import { CommerceController } from "./commerce.controller";
import { CommerceService } from "./commerce.service";
import { EcommerceController } from "./ecommerce.controller";
import { EcommerceService } from "./ecommerce.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";

@Module({
  // EmailModule so a confirmed order can send its own confirmation.
  imports: [PrismaModule, EmailModule],
  controllers: [CommerceController, EcommerceController],
  providers: [CommerceService, EcommerceService]
})
export class CommerceModule {}
