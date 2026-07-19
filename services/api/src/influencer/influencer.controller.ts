import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InfluencerService } from "./influencer.service";

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
  @Get(":id")
  async getInfluencerById(@Param("id") id: string) {
    return await this.influencerService.getInfluencerById(id);
  }

  // Admin: Get all influencers (including inactive)
  @ApiTags("👨‍💼 Admin Influencers")
  @Get("admin/all")
  async getAllInfluencers() {
    return await this.influencerService.getAllInfluencers();
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @Post("admin/create")
  async createInfluencer(@Body() body: any) {
    return await this.influencerService.createInfluencer(body);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @Put("admin/:id")
  async updateInfluencer(@Param("id") id: string, @Body() body: any) {
    return await this.influencerService.updateInfluencer(id, body);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @Delete("admin/:id")
  async deleteInfluencer(@Param("id") id: string) {
    return await this.influencerService.deleteInfluencer(id);
  }

  @ApiTags("👨‍💼 Admin Influencers")
  @Get("admin/:id/stats")
  async getInfluencerStats(@Param("id") id: string) {
    return await this.influencerService.getInfluencerStats(id);
  }
}
