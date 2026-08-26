import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // `category` is the fit / product type (regular, oversized, jersey, polo, hoodie).
  // There is no gender or seasonal-collection filtering: the catalogue is unisex.
  async listProducts(filters: {
    category?: string;
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
        category: filters.category ? { slug: filters.category } : undefined,
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
          { theme: { name: { contains: filters.q, mode: "insensitive" } } }
        ] : undefined
      },
      include: {
        category: true,
        theme: true,
        images: { orderBy: { priority: "asc" } },
        variants: { include: { inventory: true } },
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
        category: true,
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

  async listFilters() {
    const [categories, themes] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { priority: "asc" } }),
      this.prisma.theme.findMany({
        where: { active: true },
        orderBy: [{ priority: "asc" }, { name: "asc" }]
      })
    ]);

    return { categories, themes };
  }
}
