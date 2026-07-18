import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailAdminService } from './email-admin.service';
import { EmailAdminController } from './email-admin.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [EmailService, EmailAdminService],
  controllers: [EmailController, EmailAdminController],
  exports: [EmailService, EmailAdminService],
})
export class EmailModule {}
