import { Module } from "@nestjs/common";
import { InfluencerService } from "./influencer.service";
import { InfluencerController } from "./influencer.controller";

@Module({
  providers: [InfluencerService],
  controllers: [InfluencerController],
  exports: [InfluencerService],
})
export class InfluencerModule {}
