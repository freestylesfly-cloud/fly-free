import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ThemeService } from "./theme.service";

@ApiTags("🎨 Admin Themes")
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

  @Get("hero-banners")
  async getHeroBanners() {
    return await this.themeService.getHeroBanners();
  }

  @Put("hero-banners/:id")
  async updateHeroBanner(@Param("id") id: string, @Body() body: any) {
    return await this.themeService.updateHeroBanner(id, body);
  }
}
