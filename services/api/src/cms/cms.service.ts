import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { STANDARD_PAGES } from "./standard-pages";

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHomePage() {
    const [collections, categories, themes, announcements, influencers, reviews, settings] = await Promise.all([
      this.safeQuery("home collections", () => this.prisma.collection.findMany({ orderBy: { priority: "asc" } }), []),
      this.safeQuery("home categories", () => this.prisma.category.findMany({ orderBy: { priority: "asc" } }), []),
      this.safeQuery("home themes", () => this.getActiveThemes(), []),
      this.safeQuery("home announcements", () => this.getActiveAnnouncements(), []),
      this.safeQuery(
        "home influencers",
        () => this.prisma.influencer.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: "desc" } }),
        []
      ),
      this.safeQuery(
        "home reviews",
        () => this.prisma.review.findMany({
          where: { status: "APPROVED" },
          include: {
            user: { select: { name: true, image: true } },
            product: { select: { name: true, slug: true, images: { take: 1, orderBy: { priority: "asc" } } } }
          },
          take: 8,
          orderBy: { createdAt: "desc" }
        }),
        []
      ),
      this.safeQuery("home settings", () => this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } }), null)
    ]);

    return { collections, categories, themes, announcements, influencers, reviews, settings: settings?.value || null };
  }

  async getFooter() {
    const [settings, categories, pages] = await Promise.all([
      this.safeQuery("footer settings", () => this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } }), null),
      this.safeQuery("footer categories", () => this.prisma.category.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] }), []),
      this.safeQuery("footer pages", () => this.prisma.page.findMany({
        where: {
          isPublished: true,
          slug: { in: STANDARD_PAGES.map((page) => page.slug) }
        },
        select: { id: true, slug: true, title: true, updatedAt: true }
      }), [])
    ]);

    const pagesBySlug = new Map(pages.map((page) => [page.slug, page]));
    const storefrontPages = STANDARD_PAGES
      .map((standardPage) => {
        const page = pagesBySlug.get(standardPage.slug);
        if (!standardPage.route.startsWith("/")) return null;

        return {
          id: page?.id,
          slug: page?.slug || standardPage.slug,
          title: page?.title || standardPage.title,
          route: standardPage.route,
          updatedAt: page?.updatedAt
        };
      })
      .filter(Boolean);

    return {
      settings: settings?.value || null,
      categories,
      pages: storefrontPages
    };
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

  /**
   * Social profiles as configured in Admin → Settings. Anything the admin has
   * not filled in comes back absent, and the storefront then renders nothing —
   * there are no compiled-in profile URLs to fall back to.
   *
   * `instagramHandle` is derived from the URL so the admin only maintains one
   * field and the feed heading can never disagree with the Follow button.
   */
  async getSocialLinks() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const links = ((setting?.value as any)?.socialLinks || {}) as Record<string, string>;

    const clean = (value?: string) => {
      const trimmed = String(value ?? "").trim();
      return trimmed || null;
    };

    const instagram = clean(links.instagram);

    return {
      instagram,
      instagramHandle: this.instagramHandle(instagram),
      facebook: clean(links.facebook),
      twitter: clean(links.twitter),
      youtube: clean(links.youtube),
      whatsapp: clean(links.whatsapp)
    };
  }

  /** "https://www.instagram.com/flyfree.ne/" -> "@flyfree.ne". */
  private instagramHandle(url: string | null) {
    if (!url) return null;
    try {
      const path = new URL(url).pathname.split("/").filter(Boolean)[0];
      return path ? `@${path}` : null;
    } catch {
      return null;
    }
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

  /** Drafts stay private — only published pages reach the storefront. */
  async getPage(slug: string) {
    const page = await this.safeQuery(
      `page ${slug}`,
      () => this.prisma.page.findFirst({ where: { slug, isPublished: true } }),
      null
    );

    if (page) return page;

    const standardPage = STANDARD_PAGES.find((item) => item.slug === slug);
    if (!standardPage) return null;

    return {
      id: null,
      slug: standardPage.slug,
      title: standardPage.title,
      content: standardPage.content,
      metaTitle: standardPage.title,
      metaDesc: null,
      isPublished: true,
      createdAt: null,
      updatedAt: null
    };
  }

  private async safeQuery<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await query();
    } catch (error: any) {
      this.logger.warn(`CMS ${label} fallback used: ${error?.message || error}`);
      return fallback;
    }
  }
}
