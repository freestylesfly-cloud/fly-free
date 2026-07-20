import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WebsiteThemeService, CreateWebsiteThemeDto } from './website-theme.service';

@Controller('api/admin/themes')
export class WebsiteThemeController {
  constructor(private readonly themeService: WebsiteThemeService) {}

  @Get('active')
  async getActiveTheme() {
    return this.themeService.getActiveTheme();
  }

  @Get()
  async getAllThemes() {
    return this.themeService.getAllThemes();
  }

  @Get(':id')
  async getThemeById(@Param('id') id: string) {
    return this.themeService.getThemeById(id);
  }

  @Get('slug/:slug')
  async getThemeBySlug(@Param('slug') slug: string) {
    return this.themeService.getThemeBySlug(slug);
  }

  @Post()
  async createTheme(@Body() dto: CreateWebsiteThemeDto) {
    return this.themeService.createTheme(dto);
  }

  @Put(':id')
  async updateTheme(@Param('id') id: string, @Body() dto: Partial<CreateWebsiteThemeDto>) {
    return this.themeService.updateTheme(id, dto);
  }

  @Delete(':id')
  async deleteTheme(@Param('id') id: string) {
    return this.themeService.deleteTheme(id);
  }

  @Put(':id/activate')
  async activateTheme(@Param('id') id: string) {
    return this.themeService.activateTheme(id);
  }

  @Put(':id/deactivate')
  async deactivateTheme(@Param('id') id: string) {
    return this.themeService.deactivateTheme(id);
  }

  @Get('stats')
  async getThemeStats() {
    return this.themeService.getThemeStats();
  }
}
