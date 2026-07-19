import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomePage() {
    const [banners, collections, categories, themes, websiteTheme, announcements, giftOptions, influencers, settings] = await Promise.all([
      this.prisma.heroBanner.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } }),
      this.prisma.collection.findMany({ orderBy: { priority: "asc" } }),
      this.prisma.category.findMany({ orderBy: { priority: "asc" } }),
      this.getActiveThemes(),
      this.getActiveWebsiteTheme(),
      this.getActiveAnnouncements(),
      this.prisma.giftOption.findMany({ where: { isActive: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }),
      this.prisma.influencer.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: "desc" } }),
      this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } })
    ]);

    return { banners, collections, categories, themes, websiteTheme, announcements, giftOptions, influencers, settings: settings?.value || null };
  }

  getActiveWebsiteTheme() {
    const now = new Date();
    return this.prisma.websiteTheme.findFirst({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });
  }

  getActiveAnnouncements() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      include: { theme: true },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    });
  }

  getActiveThemes() {
    const now = new Date();
    return this.prisma.theme.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      include: {
        products: {
          where: { isVisible: true },
          take: 8,
          include: { images: true }
        }
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }]
    });
  }

  getTheme(slug: string) {
    return this.prisma.theme.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isVisible: true },
          include: { images: true, category: true, collection: true },
          orderBy: { createdAt: "desc" }
        },
        announcements: {
          where: { isActive: true },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
        }
      }
    });
  }

  getPage(slug: string) {
    return this.prisma.page.findUnique({ where: { slug } });
  }
}
