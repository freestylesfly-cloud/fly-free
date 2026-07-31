import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogInterceptor } from './activity-log.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    LoggerService,
    ActivityLogService,
    // Records every request outcome to the database.
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
  controllers: [LoggerController, ActivityLogController],
  exports: [LoggerService, ActivityLogService],
})
export class LoggerModule {}
