import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailAdminService } from './email-admin.service';
import { EmailAdminController } from './email-admin.controller';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [EmailService, EmailAdminService, NewsletterService],
  controllers: [EmailController, EmailAdminController, NewsletterController],
  exports: [EmailService, EmailAdminService],
})
export class EmailModule {}
