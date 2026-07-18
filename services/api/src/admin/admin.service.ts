import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUCTS ====================
  async listCategories() {
    return this.prisma.category.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] });
  }

  async listProducts(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search?.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" as const } },
            { sku: { contains: search.trim(), mode: "insensitive" as const } }
          ]
        }
      : {};
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true, variants: { include: { inventory: true } }, images: true },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getProduct(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: { include: { inventory: true } }, images: true, collection: true, theme: true }
    });
  }

  async createProduct(data: any) {
    const categoryId = data.categoryId || (await this.ensureDefaultCategory()).id;
    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        sku: data.sku || `SKU-${Date.now()}`,
        description: data.description || "",
        gender: data.gender || "UNISEX",
        tags: data.tags || [],
        material: data.material,
        washCare: data.washCare,
        price: Number(data.price),
        mrp: Number(data.mrp || data.price),
        discountPercent: data.discountPercent || 0,
        gstPercent: data.gstPercent || 5,
        weightGrams: data.weightGrams,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        isVisible: data.isVisible ?? true,
        isFeatured: data.isFeatured ?? false,
        isTrending: data.isTrending ?? false,
        isNewArrival: data.isNewArrival ?? false,
        categoryId,
        collectionId: data.collectionId,
        themeId: data.themeId,
        variants: Array.isArray(data.variants) ? {
          create: data.variants.map((variant: any) => ({
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            price: variant.price ? Number(variant.price) : undefined,
            inventory: {
              create: {
                stock: Number(variant.stock || 0),
                lowStockAlert: Number(variant.lowStockAlert || 5),
                warehouse: variant.warehouse || undefined,
                barcode: variant.barcode || undefined
              }
            }
          }))
        } : undefined,
        images: data.images ? {
          createMany: { data: data.images }
        } : undefined
      },
      include: { category: true, variants: { include: { inventory: true } }, images: true }
    });
  }

  async updateProduct(id: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      if (Array.isArray(data.variants)) {
        const existingVariants = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
        await tx.inventory.deleteMany({ where: { variantId: { in: existingVariants.map((variant) => variant.id) } } });
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      if (Array.isArray(data.images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          description: data.description,
          gender: data.gender,
          tags: data.tags,
          material: data.material,
          washCare: data.washCare,
          price: data.price === undefined ? undefined : Number(data.price),
          mrp: data.mrp === undefined ? undefined : Number(data.mrp),
          discountPercent: data.discountPercent,
          gstPercent: data.gstPercent,
          weightGrams: data.weightGrams,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          isVisible: data.isVisible,
          isFeatured: data.isFeatured,
          isTrending: data.isTrending,
          isNewArrival: data.isNewArrival,
          categoryId: data.categoryId,
          collectionId: data.collectionId,
          themeId: data.themeId,
          images: Array.isArray(data.images) ? { createMany: { data: data.images } } : undefined,
          variants: Array.isArray(data.variants) ? {
            create: data.variants.map((variant: any) => ({
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              price: variant.price ? Number(variant.price) : undefined,
              inventory: {
                create: {
                  stock: Number(variant.stock || 0),
                  lowStockAlert: Number(variant.lowStockAlert || 5),
                  warehouse: variant.warehouse || undefined,
                  barcode: variant.barcode || undefined
                }
              }
            }))
          } : undefined
        },
        include: { category: true, variants: { include: { inventory: true } }, images: true }
      });
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
      await tx.inventory.deleteMany({ where: { variantId: { in: variants.map((variant) => variant.id) } } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.delete({ where: { id } });
    });
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }

  private async ensureDefaultCategory() {
    return this.prisma.category.upsert({
      where: { slug: "uncategorized" },
      update: {},
      create: { name: "Uncategorized", slug: "uncategorized" }
    });
  }

  // ==================== ORDERS ====================
  async listOrders(status?: string, page: number = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status && ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: { user: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getOrder(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: { include: { product: true } } }
    });
  }

  async updateOrderStatus(id: string, status: string) {
    const validStatuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    const normalizedStatus = status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: normalizedStatus as any },
      include: { user: true, items: { include: { product: true } } }
    });
  }

  // ==================== USERS ====================
  async listUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          image: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.user.count()
    ]);

    const usersWithOrders = await Promise.all(
      users.map(async (u) => ({
        ...u,
        totalOrders: await this.prisma.order.count({ where: { userId: u.id } })
      }))
    );

    return {
      data: usersWithOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: { include: { items: true } },
        addresses: true
      }
    });
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        image: data.image
      }
    });
  }

  // ==================== REVIEWS ====================
  async listReviews(params: { page: number; limit: number; status?: string; rating?: number; search?: string }) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 10, 1), 100);
    const skip = (page - 1) * limit;
    const normalizedStatus = params.status?.toUpperCase();
    const where: any = {};

    if (normalizedStatus && ["PENDING", "APPROVED", "REJECTED"].includes(normalizedStatus)) {
      where.status = normalizedStatus;
    }

    if (params.rating && params.rating >= 1 && params.rating <= 5) {
      where.rating = params.rating;
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true, sku: true } },
          user: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.review.count({ where })
    ]);

    return {
      data: reviews.map((review) => ({
        ...review,
        content: review.body
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async updateReviewStatus(id: string, status: string) {
    const normalizedStatus = status.toUpperCase();
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid review status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const review = await this.prisma.review.update({
      where: { id },
      data: { status: normalizedStatus as any },
      include: {
        product: { select: { id: true, name: true, slug: true, sku: true } },
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    return { ...review, content: review.body };
  }

  // ==================== THEMES ====================
  async listThemes() {
    return this.prisma.theme.findMany({
      orderBy: { id: "asc" }
    });
  }

  async getActiveTheme() {
    return this.prisma.theme.findFirst({
      where: { active: true }
    });
  }

  async setActiveTheme(id: string) {
    // Deactivate all themes
    await this.prisma.theme.updateMany({
      where: { active: true },
      data: { active: false }
    });

    // Activate selected theme
    return this.prisma.theme.update({
      where: { id },
      data: { active: true }
    });
  }

  // ==================== SETTINGS ====================
  async getSettings() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    return {
      data: setting?.value || {
        appName: "",
        appDescription: "",
        appLogo: "",
        appFavicon: "",
        contactEmail: "",
        contactPhone: "",
        supportEmail: "",
        smtpHost: "",
        smtpPort: "",
        smtpUser: "",
        footerText: "",
        socialLinks: {}
      }
    };
  }

  async updateSettings(data: any) {
    const setting = await this.prisma.appSetting.upsert({
      where: { key: "admin_settings" },
      update: { value: data },
      create: { key: "admin_settings", value: data }
    });

    return { data: setting.value };
  }

  // ==================== ANALYTICS ====================
  async getDashboardMetrics() {
    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      totalReviews,
      averageRating,
      recentOrders,
      orderStatusCounts
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["DELIVERED", "SHIPPED", "PACKED", "CONFIRMED"] } }
      }),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count({ where: { status: { in: ["PLACED", "CONFIRMED"] } } }),
      this.prisma.inventory.count({ where: { stock: { lte: 5 } } }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ _avg: { rating: true }, where: { status: "APPROVED" } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true, payment: true }
      }),
      this.prisma.order.groupBy({
        by: ["status"],
        _count: { id: true }
      })
    ]);

    return {
      metrics: {
        revenue: totalRevenue._sum?.total || 0,
        orders: totalOrders,
        users: totalUsers,
        products: totalProducts,
        pendingOrders,
        lowStockProducts,
        totalReviews,
        averageRating: Number((averageRating._avg.rating || 0).toFixed(1))
      },
      recentOrders: recentOrders.map((order, index) => ({
        id: order.id,
        orderNumber: `ORD-${String(index + 1).padStart(3, "0")}`,
        customer: order.user?.name || order.user?.email || "Customer",
        amount: order.total,
        status: order.status,
        paymentStatus: order.payment?.status || "PENDING",
        createdAt: order.createdAt
      })),
      charts: {
        orderStatus: orderStatusCounts.map((item) => ({
          label: item.status,
          value: item._count.id
        }))
      }
    };
  }

  async getSalesAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await this.prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    });

    return { period: `${days} days`, data: sales };
  }

  async getRevenueAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenue = await this.prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate }, status: "DELIVERED" },
      _sum: { total: true }
    });

    return { period: `${days} days`, data: revenue };
  }

  async getOrderAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const byStatus = await this.prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    });

    return { period: `${days} days`, byStatus };
  }
}
