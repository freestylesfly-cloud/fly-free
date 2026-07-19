import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { InfluencerModule } from "../influencer/influencer.module";
import { ReviewModule } from "../review/review.module";

@Module({
  imports: [PrismaModule, EmailModule, InfluencerModule, ReviewModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
