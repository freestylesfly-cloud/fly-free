import { Body, Controller, Delete, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ActivityLogService } from "./activity-log.service";
import { AdminGuard } from "../auth/admin.guard";

@ApiTags("📊 Admin Logs")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller("admin/activity-logs")
export class ActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  @Get()
  list(
    @Query("level") level?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("userId") userId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.activityLog.list({
      level,
      status,
      search,
      userId,
      page: Number(page) || 1,
      limit: Number(limit) || 50
    });
  }

  @Get("stats")
  stats() {
    return this.activityLog.stats();
  }

  @Delete()
  clear(@Body() body?: { olderThanDays?: number }) {
    return this.activityLog.clear(body?.olderThanDays);
  }
}
