import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ThemeService } from "./theme.service";
import { AdminGuard } from "../auth/admin.guard";

@ApiTags("🎨 Admin Themes")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller("admin/themes")
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  async getAllThemes() {
    return await this.themeService.getAllThemes();
  }

  @Get("active")
  async getActiveThemes() {
    return await this.themeService.getActiveThemes();
  }

  @Get(":slug")
  async getThemeBySlug(@Param("slug") slug: string) {
    return await this.themeService.getThemeBySlug(slug);
  }

  @Post()
  async createTheme(@Body() body: any) {
    return await this.themeService.createTheme(body);
  }

  @Put(":id")
  async updateTheme(@Param("id") id: string, @Body() body: any) {
    return await this.themeService.updateTheme(id, body);
  }

  @Put(":id/activate")
  async activateTheme(@Param("id") id: string) {
    return await this.themeService.activateTheme(id);
  }

  @Delete(":id")
  async deleteTheme(@Param("id") id: string) {
    return await this.themeService.deleteTheme(id);
  }
}
