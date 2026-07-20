import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts(filters: {
    category?: string;
    theme?: string;
    collection?: string;
    q?: string;
    gender?: string;
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

    return this.prisma.product.findMany({
      where: {
        isVisible: true,
        category: filters.category ? { slug: filters.category } : undefined,
        theme: filters.theme ? { slug: filters.theme } : undefined,
        collection: filters.collection ? { slug: filters.collection } : undefined,
        gender: filters.gender && ["MEN", "WOMEN", "UNISEX"].includes(filters.gender.toUpperCase())
          ? filters.gender.toUpperCase() as any
          : undefined,
        price: minPrice || maxPrice ? {
          gte: minPrice,
          lte: maxPrice
        } : undefined,
        tags: filters.tag ? { has: filters.tag } : undefined,
        reviews: minRating ? { some: { rating: { gte: minRating }, status: "APPROVED" } } : undefined,
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
        collection: true,
        theme: true,
        images: { orderBy: { priority: "asc" } },
        variants: { include: { inventory: true } }
      },
      orderBy
    });
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        collection: true,
        theme: true,
        images: { orderBy: { priority: "asc" } },
        variants: { include: { inventory: true } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product || !product.isVisible) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  listCollections() {
    return this.prisma.collection.findMany({ orderBy: { priority: "asc" } });
  }

  async listFilters() {
    const [categories, themes, collections] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { priority: "asc" } }),
      this.prisma.theme.findMany({
        where: { active: true },
        orderBy: [{ priority: "asc" }, { name: "asc" }]
      }),
      this.listCollections()
    ]);

    return { categories, themes, collections };
  }
}
