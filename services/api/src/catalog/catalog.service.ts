import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { liveMediaUrl } from "../storage/media-storage";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // `category` is the fit / product type (regular, oversized, jersey, polo, hoodie).
  // There is no gender or seasonal-collection filtering: the catalogue is unisex.
  async listProducts(filters: {
    category?: string;
    /// Product type slug, e.g. "hoodies".
    type?: string;
    theme?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    tag?: string;
    sort?: string;
  } = {}) {
    const minPrice = filters.minPrice ? Number(filters.minPrice) * 100 : undefined;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) * 100 : undefined;
    const minRating = filters.rating ? Number(filters.rating) : undefined;
    const orderBy =
      filters.sort === "price-asc"
        ? { price: "asc" as const }
        : filters.sort === "price-desc"
          ? { price: "desc" as const }
          : filters.sort === "name-asc"
            ? { name: "asc" as const }
            : filters.sort === "name-desc"
              ? { name: "desc" as const }
              : filters.sort === "popular"
            ? { updatedAt: "desc" as const }
            : { createdAt: "desc" as const };

    const products = await this.prisma.product.findMany({
      where: {
        isVisible: true,
        // A style (category) slug, a product type slug, or both.
        category:
          filters.category || filters.type
            ? {
                ...(filters.category ? { slug: filters.category } : {}),
                ...(filters.type ? { productType: { slug: filters.type } } : {})
              }
            : undefined,
        theme: filters.theme ? { slug: filters.theme } : undefined,
        price: minPrice || maxPrice ? {
          gte: minPrice,
          lte: maxPrice
        } : undefined,
        tags: filters.tag ? { has: filters.tag } : undefined,
        OR: filters.q ? [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
          { tags: { has: filters.q } },
          { category: { name: { contains: filters.q, mode: "insensitive" } } },
          { category: { productType: { name: { contains: filters.q, mode: "insensitive" } } } },
          { theme: { name: { contains: filters.q, mode: "insensitive" } } }
        ] : undefined
      },
      // Selected, not included: `include` shipped every column of every product
      // plus whole category, theme, variant and inventory rows, and 68% of the
      // resulting payload was fields the storefront never renders. The grid is
      // the most-requested endpoint on the site, so that waste dominated the
      // database's network transfer. Detail-only fields (material, washCare,
      // brand, seo*, sku, tags) are served by getProduct instead.
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        mrp: true,
        discountPercent: true,
        isFeatured: true,
        isTrending: true,
        isNewArrival: true,
        videoUrl: true,
        images: {
          select: { id: true, url: true, alt: true, color: true, priority: true },
          orderBy: { priority: "asc" }
        },
        category: { select: { name: true, slug: true, productType: { select: { name: true, slug: true } } } },
        // Colours feed the homepage "new drop" ring, so it matches the theme.
        theme: { select: { name: true, slug: true, primaryColor: true, accentColor: true } },
        // `price` is required: quick-add prices from the variant when it has one.
        variants: {
          select: { id: true, size: true, color: true, price: true, inventory: { select: { stock: true } } }
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true }
        }
      },
      orderBy
    });

    if (!minRating) return products;

    return products.filter((product) => {
      const ratings = product.reviews.map((review) => Number(review.rating || 0));
      if (!ratings.length) return false;
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      return averageRating >= minRating;
    });
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        // The type carries the size list (display order) and the shop label.
        // Sibling styles let the size guide offer tabs for this product's type only.
        category: { include: { productType: { include: { categories: { select: { name: true, slug: true }, orderBy: [{ priority: "asc" }, { name: "asc" }] } } } } },
        theme: true,
        images: { orderBy: { priority: "asc" } },
        variants: { include: { inventory: true } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" }
        },
        instagramPosts: {
          where: {
            OR: [
              { imageUrl: { not: null } },
              { videoUrl: { not: null } }
            ]
          },
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            videoUrl: true,
            caption: true,
            instagramLink: true,
            displayOrder: true
          }
        }
      }
    });

    if (!product || !product.isVisible) {
      throw new NotFoundException("Product not found");
    }

    // Hampers are attached to a theme, so every product in that theme can be
    // gifted in the same box. Product-specific hampers are merged in as well.
    const hampers = await this.prisma.productHamper.findMany({
      where: {
        isActive: true,
        OR: [
          { productId: product.id },
          ...(product.themeId ? [{ themeId: product.themeId }] : [])
        ]
      },
      orderBy: { priority: "asc" }
    });

    return { ...product, hampers };
  }

  /**
   * Navigation and filter data. `productTypes` lists only active types that
   * have visible products, each with its styles that do — an empty Hoodies
   * type stays off the menu until its first hoodie is published.
   * `categories` (every style, flat) is kept for older clients.
   */
  async listFilters() {
    const [categories, themes, types, counts] = await Promise.all([
      this.prisma.category.findMany({
        orderBy: { priority: "asc" },
        include: { productType: { select: { name: true, slug: true } } }
      }),
      this.prisma.theme.findMany({
        where: { active: true },
        orderBy: [{ priority: "asc" }, { name: "asc" }]
      }),
      this.prisma.productType.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "asc" }, { name: "asc" }],
        include: { categories: { orderBy: [{ priority: "asc" }, { name: "asc" }] } }
      }),
      this.prisma.product.groupBy({ by: ["categoryId"], where: { isVisible: true }, _count: { _all: true } })
    ]);

    // A style without a usable image borrows the first photo of its newest product.
    const missing = types.flatMap((type) => type.categories).filter((style) => !liveMediaUrl(style.imageUrl));
    const covers = new Map<string, string>();
    await Promise.all(
      missing.map(async (style) => {
        const image = await this.prisma.productImage.findFirst({
          where: { product: { categoryId: style.id, isVisible: true } },
          orderBy: [{ product: { createdAt: "desc" } }, { priority: "asc" }],
          select: { url: true }
        });
        if (image?.url) covers.set(style.id, image.url);
      })
    );

    const perStyle = new Map(counts.map((row) => [row.categoryId, row._count._all]));
    const productTypes = types
      .map((type) => {
        const styles = type.categories
          .map((style) => ({
            id: style.id,
            name: style.name,
            slug: style.slug,
            imageUrl: liveMediaUrl(style.imageUrl) || covers.get(style.id) || null,
            productCount: perStyle.get(style.id) || 0
          }))
          .filter((style) => style.productCount > 0);
        return {
          id: type.id,
          name: type.name,
          slug: type.slug,
          description: type.description,
          imageUrl: type.imageUrl,
          sizes: type.sizes,
          productCount: styles.reduce((sum, style) => sum + style.productCount, 0),
          styles
        };
      })
      .filter((type) => type.productCount > 0);

    return { productTypes, categories, themes };
  }
}
