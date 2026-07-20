import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateWebsiteThemeDto {
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  animationStyle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDesktopImageUrl?: string;
  heroMobileImageUrl?: string;
  heroCtaLabel?: string;
  heroHref?: string;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
}

@Injectable()
export class WebsiteThemeService {
  constructor(private prisma: PrismaService) {}

  async getActiveTheme() {
    return this.prisma.websiteTheme.findFirst({
      where: { isActive: true },
      orderBy: { priority: 'asc' }
    });
  }

  async getAllThemes() {
    return this.prisma.websiteTheme.findMany({
      orderBy: [{ isActive: 'desc' }, { priority: 'asc' }]
    });
  }

  async getThemeById(id: string) {
    return this.prisma.websiteTheme.findUnique({
      where: { id }
    });
  }

  async getThemeBySlug(slug: string) {
    return this.prisma.websiteTheme.findUnique({
      where: { slug }
    });
  }

  async createTheme(dto: CreateWebsiteThemeDto) {
    return this.prisma.websiteTheme.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        backgroundColor: dto.backgroundColor,
        textColor: dto.textColor,
        accentColor: dto.accentColor,
        fontFamily: dto.fontFamily,
        animationStyle: dto.animationStyle || 'fade',
        heroTitle: dto.heroTitle,
        heroSubtitle: dto.heroSubtitle,
        heroDesktopImageUrl: dto.heroDesktopImageUrl,
        heroMobileImageUrl: dto.heroMobileImageUrl,
        heroCtaLabel: dto.heroCtaLabel,
        heroHref: dto.heroHref,
        priority: dto.priority || 0,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        isActive: false
      }
    });
  }

  async updateTheme(id: string, dto: Partial<CreateWebsiteThemeDto>) {
    return this.prisma.websiteTheme.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        backgroundColor: dto.backgroundColor,
        textColor: dto.textColor,
        accentColor: dto.accentColor,
        fontFamily: dto.fontFamily,
        animationStyle: dto.animationStyle,
        heroTitle: dto.heroTitle,
        heroSubtitle: dto.heroSubtitle,
        heroDesktopImageUrl: dto.heroDesktopImageUrl,
        heroMobileImageUrl: dto.heroMobileImageUrl,
        heroCtaLabel: dto.heroCtaLabel,
        heroHref: dto.heroHref,
        priority: dto.priority,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt
      }
    });
  }

  async deleteTheme(id: string) {
    return this.prisma.websiteTheme.delete({
      where: { id }
    });
  }

  async activateTheme(id: string) {
    await this.prisma.websiteTheme.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    return this.prisma.websiteTheme.update({
      where: { id },
      data: { isActive: true }
    });
  }

  async deactivateTheme(id: string) {
    return this.prisma.websiteTheme.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getThemeStats() {
    const total = await this.prisma.websiteTheme.count();
    const active = await this.prisma.websiteTheme.count({
      where: { isActive: true }
    });

    return { total, active };
  }
}
