import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CmsService } from "./cms.service";

@ApiTags("📰 CMS")
@Controller("cms")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get("home")
  getHomePage() {
    return this.cmsService.getHomePage();
  }

  @Get("footer")
  getFooter() {
    return this.cmsService.getFooter();
  }

  @Get("settings/logo")
  getSettingsLogo() {
    return this.cmsService.getSettingsLogo();
  }

  @Get("settings/delivery")
  getDeliverySettings() {
    return this.cmsService.getDeliverySettings();
  }

  @Get("settings/social")
  getSocialLinks() {
    return this.cmsService.getSocialLinks();
  }

  @Get("size-guides")
  getSizeGuides() {
    return this.cmsService.getSizeGuides();
  }

  @Get("faqs")
  getFaqItems() {
    return this.cmsService.getFaqItems();
  }

  @Post("help-request")
  createHelpRequest(@Body() body: any) {
    return this.cmsService.createHelpRequest(body);
  }

  @Get("announcements")
  getAnnouncements() {
    return this.cmsService.getActiveAnnouncements();
  }

  @Get("themes")
  getThemes() {
    return this.cmsService.getActiveThemes();
  }

  @Get("hampers")
  getHampers() {
    return this.cmsService.getVisibleHampers();
  }

  @Get("themes/:slug")
  getTheme(@Param("slug") slug: string) {
    return this.cmsService.getTheme(slug);
  }

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string) {
    return this.cmsService.getPage(slug);
  }
}
