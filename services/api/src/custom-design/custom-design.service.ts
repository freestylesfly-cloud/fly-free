import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomDesignDto } from './dto/create-custom-design.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CustomDesignService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  async createCustomDesign(token: string, dto: CreateCustomDesignDto) {
    const userId = this.extractUserId(token);
    return this.prisma.customDesign.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        images: dto.images || [],
        size: dto.size,
        color: dto.color,
        placement: dto.placement,
        notes: dto.notes,
        status: 'PENDING'
      }
    });
  }

  async getUserCustomDesigns(token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.customDesign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomDesignById(id: string, token?: string) {
    const userId = token ? this.extractUserId(token) : undefined;
    const where: any = { id };
    if (userId) where.userId = userId;

    return this.prisma.customDesign.findUnique({
      where
    });
  }

  async updateCustomDesignStatus(id: string, status: string) {
    return this.prisma.customDesign.update({
      where: { id },
      data: { status }
    });
  }

  async setCustomDesignPrice(id: string, price: number) {
    return this.prisma.customDesign.update({
      where: { id },
      data: { price }
    });
  }

  async deleteCustomDesign(id: string, token: string) {
    const userId = this.extractUserId(token);
    const design = await this.prisma.customDesign.findUnique({
      where: { id }
    });

    if (design?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.customDesign.delete({
      where: { id }
    });
  }

  async getAllCustomDesigns(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.customDesign.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomDesignStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.customDesign.count(),
      this.prisma.customDesign.count({ where: { status: 'PENDING' } }),
      this.prisma.customDesign.count({ where: { status: 'APPROVED' } }),
      this.prisma.customDesign.count({ where: { status: 'REJECTED' } })
    ]);

    return { total, pending, approved, rejected };
  }

  private extractUserId(token: string): string {
    if (!token) {
      throw new UnauthorizedException('Login required');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'dev-secret-key';
      const decoded = jwt.verify(token.replace('Bearer ', ''), secret) as any;
      if (!decoded.userId) throw new Error('Missing userId');
      return decoded.userId;
    } catch {
      throw new UnauthorizedException('Invalid login session');
    }
  }
}
