import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { InfluencerService } from "./influencer.service";
import { AdminGuard } from "../auth/admin.guard";

@Controller("influencers")
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  // Public: Get active influencers for display
  @ApiTags("🌟 Influencers")
  @Get()
  async getActiveInfluencers() {
    return await this.influencerService.getActiveInfluencers();
  }

  @ApiTags("🌟 Influencers")
  @Get("featured")
  async getHomepageFeaturedInfluencers() {
    return await this.influencerService.getHomepageFeaturedInfluencers();
  }

  @ApiTags("🌟 Influencers")
  @Get(":id")
  async getInfluencerById(@Param("id") id: string) {
    return await this.influencerService.getInfluencerById(id);
  }

  // Admin: Get all influencers (including inactive)
  @ApiTags("👨‍💼 Admin Influencers")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Get("admin/all")
  async getAllInfluencers() {
    return await this.influencerService.getAllInfluencers();
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Post("admin/create")
  async createInfluencer(@Body() body: any) {
    return await this.influencerService.createInfluencer(body);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Put("admin/:id")
  async updateInfluencer(@Param("id") id: string, @Body() body: any) {
    return await this.influencerService.updateInfluencer(id, body);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Delete("admin/:id")
  async deleteInfluencer(@Param("id") id: string) {
    return await this.influencerService.deleteInfluencer(id);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Get("admin/:id/stats")
  async getInfluencerStats(@Param("id") id: string) {
    return await this.influencerService.getInfluencerStats(id);
  }
}
