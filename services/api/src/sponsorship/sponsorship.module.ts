import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SponsorshipController } from "./sponsorship.controller";
import { SponsorshipService } from "./sponsorship.service";

@Module({
  imports: [PrismaModule],
  controllers: [SponsorshipController],
  providers: [SponsorshipService],
  // CmsModule serves the public storefront read through this service.
  exports: [SponsorshipService],
})
export class SponsorshipModule {}
