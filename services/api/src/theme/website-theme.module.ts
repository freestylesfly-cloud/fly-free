import { Module } from '@nestjs/common';
import { WebsiteThemeService } from './website-theme.service';
import { WebsiteThemeController } from './website-theme.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebsiteThemeController],
  providers: [WebsiteThemeService],
  exports: [WebsiteThemeService]
})
export class WebsiteThemeModule {}
