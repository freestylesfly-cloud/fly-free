import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomePage() {
    const [collections, categories, themes, announcements, influencers, reviews, settings] = await Promise.all([
      this.prisma.collection.findMany({ orderBy: { priority: "asc" } }),
      this.prisma.category.findMany({ orderBy: { priority: "asc" } }),
      this.getActiveThemes(),
      this.getActiveAnnouncements(),
      this.prisma.influencer.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: "desc" } }),
      this.prisma.review.findMany({
        where: { status: "APPROVED" },
        include: {
          user: { select: { name: true, image: true } },
          product: { select: { name: true, slug: true, images: { take: 1, orderBy: { priority: "asc" } } } }
        },
        take: 8,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } })
    ]);

    return { collections, categories, themes, announcements, influencers, reviews, settings: settings?.value || null };
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

  async getSettingsLogo() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const value = setting?.value as any;

    return {
      logoUrl: value?.appLogo || '/brand/logo.png',
      faviconUrl: value?.appFavicon || '/favicon_io/favicon.ico'
    };
  }

  getSizeGuides() {
    return this.prisma.sizeGuide.findMany({
      where: { active: true },
      orderBy: { priority: "asc" }
    });
  }

  // Delivery is the only charge on top of the item total. Values in rupees.
  async getDeliverySettings() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const value = setting?.value as any;

    return {
      deliveryFee: Number(value?.deliveryFee ?? 60),
      freeDeliveryAbove: Number(value?.freeDeliveryAbove ?? 1000)
    };
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

  // Hampers hang off a theme, so each one links through to that theme's products.
  getVisibleHampers() {
    return this.prisma.productHamper.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      include: {
        theme: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, name: true, slug: true } }
      }
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
