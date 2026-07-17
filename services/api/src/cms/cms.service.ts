import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomePage() {
    const [banners, collections] = await Promise.all([
      this.prisma.heroBanner.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } }),
      this.prisma.collection.findMany({ orderBy: { priority: "asc" } })
    ]);

    return { banners, collections };
  }
}
