import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUCTS ====================
  async listProducts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: { category: true, variants: true, images: true },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.product.count()
    ]);

    return {
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getProduct(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true, images: true, collections: true }
    });
  }

  async createProduct(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        discount: data.discount || 0,
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        variants: data.variants ? {
          createMany: { data: data.variants }
        } : undefined,
        images: data.images ? {
          createMany: { data: data.images }
        } : undefined
      },
      include: { category: true, variants: true, images: true }
    });
  }

  async updateProduct(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        discount: data.discount
      },
      include: { category: true, variants: true, images: true }
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  // ==================== ORDERS ====================
  async listOrders(status?: string, page: number = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

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
      include: { user: true, items: { include: { product: true, variant: true } } }
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
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
          avatar: true,
          createdAt: true,
          orders: { select: { id: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.user.count()
    ]);

    return {
      data: users.map(u => ({ ...u, totalOrders: u.orders.length })),
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
        avatar: data.avatar
      }
    });
  }

  // ==================== THEMES ====================
  async listThemes() {
    return this.prisma.theme.findMany({
      orderBy: { priority: "asc" }
    });
  }

  async getActiveTheme() {
    return this.prisma.theme.findFirst({
      where: { isActive: true }
    });
  }

  async setActiveTheme(id: string) {
    // Deactivate all themes
    await this.prisma.theme.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Activate selected theme
    return this.prisma.theme.update({
      where: { id },
      data: { isActive: true }
    });
  }

  // ==================== ANALYTICS ====================
  async getDashboardMetrics() {
    const [totalRevenue, totalOrders, totalUsers, totalProducts] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "completed" }
      }),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.product.count()
    ]);

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });

    return {
      metrics: {
        revenue: totalRevenue._sum.totalAmount || 0,
        orders: totalOrders,
        users: totalUsers,
        products: totalProducts
      },
      recentOrders
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
      where: { createdAt: { gte: startDate }, status: "completed" },
      _sum: { totalAmount: true }
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
