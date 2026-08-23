import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../auth/admin.guard";
import { AnalyticsService } from "./analytics.service";

@ApiTags("Analytics")
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("analytics/events")
  track(@Body() body: any, @Req() request: any) {
    return this.analytics.track(body, request);
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get("admin/analytics/events")
  summary(@Query("days") days?: string) {
    return this.analytics.summary(days ? parseInt(days) : 30);
  }
}
