import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InstagramController],
  providers: [InstagramService, PrismaService],
  exports: [InstagramService],
})
export class InstagramModule {}
