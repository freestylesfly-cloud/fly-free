import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomDesignService } from './custom-design.service';
import { CustomDesignController } from './custom-design.controller';

@Module({
  imports: [PrismaModule],
  providers: [CustomDesignService],
  controllers: [CustomDesignController],
  exports: [CustomDesignService]
})
export class CustomDesignModule {}
