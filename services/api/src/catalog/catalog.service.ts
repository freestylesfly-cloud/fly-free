import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts(category?: string) {
    return this.prisma.product.findMany({
      where: {
        isVisible: true,
        category: category ? { slug: category } : undefined
      },
      include: {
        category: true,
        collection: true,
        images: true,
        variants: true
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
        images: true,
        variants: { include: { inventory: true } },
        reviews: { where: { status: "APPROVED" } }
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
}
