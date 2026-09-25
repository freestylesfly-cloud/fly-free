import { Module } from "@nestjs/common";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";
import { SponsorshipModule } from "../sponsorship/sponsorship.module";

@Module({
  imports: [SponsorshipModule],
  controllers: [CmsController],
  providers: [CmsService]
})
export class CmsModule {}
