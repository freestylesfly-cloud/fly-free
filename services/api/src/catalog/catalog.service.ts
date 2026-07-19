import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts(category?: string, theme?: string) {
    return this.prisma.product.findMany({
      where: {
        isVisible: true,
        category: category ? { slug: category } : undefined,
        theme: theme ? { slug: theme } : undefined
      },
      include: {
        category: true,
        collection: true,
        theme: true,
        images: { orderBy: { priority: "asc" } },
        variants: { include: { inventory: true } }
      },
      orderBy: { createdAt: "desc" }
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
