import { Controller, Get } from "@nestjs/common";
import { CmsService } from "./cms.service";

@Controller("cms")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get("home")
  getHomePage() {
    return this.cmsService.getHomePage();
  }
}
