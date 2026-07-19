import { Controller, Get, Param } from "@nestjs/common";
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

  @Get("announcements")
  getAnnouncements() {
    return this.cmsService.getActiveAnnouncements();
  }

  @Get("themes")
  getThemes() {
    return this.cmsService.getActiveThemes();
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
