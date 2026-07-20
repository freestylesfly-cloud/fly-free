import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all themes
  async getAllThemes() {
    return await this.prisma.theme.findMany({
      include: {
        products: { take: 8 },
        announcements: true,
      },
      orderBy: { priority: "asc" },
    });
  }

  // Get active themes (for homepage)
  async getActiveThemes() {
    const now = new Date();
    return await this.prisma.theme.findMany({
      where: {
        active: true,
        OR: [
          { startsAt: null, endsAt: null }, // Always active
          { startsAt: { lte: now }, endsAt: { gte: now } }, // Within date range
          { startsAt: { lte: now }, endsAt: null }, // Started, no end
          { startsAt: null, endsAt: { gte: now } }, // No start, not ended
        ],
      },
      include: {
        products: { take: 8 },
        announcements: true,
      },
      orderBy: { priority: "asc" },
    });
  }

  // Get theme by slug
  async getThemeBySlug(slug: string) {
    return await this.prisma.theme.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            images: true,
            variants: true,
          },
        },
        announcements: true,
      },
    });
  }

  // Create theme
  async createTheme(data: any) {
    return await this.prisma.theme.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        story: data.story,
        imageUrl: data.imageUrl,
        bannerImageUrl: data.bannerImageUrl,
        primaryColor: data.primaryColor || "#111827",
        secondaryColor: data.secondaryColor || "#ff6b5b",
        accentColor: data.accentColor || "#4ecdc4",
        fontFamily: data.fontFamily || "Inter, Arial, sans-serif",
        animationStyle: data.animationStyle || "fade",
        priority: data.priority || 0,
        active: data.active || false,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
      include: {
        products: true,
      },
    });
  }

  // Update theme
  async updateTheme(id: string, data: any) {
    return await this.prisma.theme.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        story: data.story,
        imageUrl: data.imageUrl,
        bannerImageUrl: data.bannerImageUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        fontFamily: data.fontFamily,
        animationStyle: data.animationStyle,
        priority: data.priority,
        active: data.active,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
      include: {
        products: true,
      },
    });
  }

  // Delete theme
  async deleteTheme(id: string) {
    return await this.prisma.theme.delete({
      where: { id },
    });
  }

  // Activate theme
  async activateTheme(id: string) {
    return await this.prisma.theme.update({
      where: { id },
      data: { active: true },
    });
  }

}
