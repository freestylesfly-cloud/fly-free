import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  // ==================== PRODUCTS ====================
  async listCategories() {
    return this.prisma.category.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] });
  }

  async createCategory(data: any) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        imageUrl: data.imageUrl || undefined,
        priority: data.priority === undefined ? 0 : Number(data.priority)
      }
    });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        imageUrl: data.imageUrl,
        priority: data.priority === undefined ? undefined : Number(data.priority)
      }
    });
  }

  async deleteCategory(id: string) {
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new Error(`Cannot delete category while ${productCount} product(s) use it.`);
    }

    return this.prisma.category.delete({ where: { id } });
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
        include: { category: true, theme: true, collection: true, variants: { include: { inventory: true } }, images: true },
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
        } : undefined,
        hampers: Array.isArray(data.hampers) ? {
          createMany: { data: data.hampers.map((hamper: any, index: number) => this.normalizeProductHamperData(hamper, index)) }
        } : undefined
      },
      include: { category: true, variants: { include: { inventory: true } }, images: true, hampers: true }
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

      if (Array.isArray(data.hampers)) {
        await tx.productHamper.deleteMany({ where: { productId: id } });
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
          hampers: Array.isArray(data.hampers) ? {
            createMany: { data: data.hampers.map((hamper: any, index: number) => this.normalizeProductHamperData(hamper, index)) }
          } : undefined,
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
        include: { category: true, variants: { include: { inventory: true } }, images: true, hampers: true }
      });
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
      await tx.inventory.deleteMany({ where: { variantId: { in: variants.map((variant) => variant.id) } } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productHamper.deleteMany({ where: { productId: id } });
      return tx.product.delete({ where: { id } });
    });
  }

  private normalizeProductHamperData(hamper: any, index = 0) {
    return {
      name: hamper.name || "Hamper package",
      description: hamper.description || undefined,
      contents: Array.isArray(hamper.contents)
        ? hamper.contents.filter(Boolean)
        : String(hamper.contentsText || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      imageUrl: hamper.imageUrl || undefined,
      images: Array.isArray(hamper.images)
        ? hamper.images.filter(Boolean)
        : String(hamper.imagesText || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      sizeNote: hamper.sizeNote || undefined,
      price: Number(hamper.price || 0),
      gstPercent: hamper.gstPercent === undefined ? 5 : Number(hamper.gstPercent),
      isActive: hamper.isActive ?? true,
      priority: hamper.priority === undefined ? index : Number(hamper.priority)
    };
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
        include: {
          user: true,
          shippingAddress: true,
          payment: true,
          invoice: true,
          referrals: { include: { influencer: true } },
          statusHistory: { orderBy: { createdAt: "asc" } },
          reviews: { include: { product: true, user: true }, orderBy: { createdAt: "desc" } },
          items: { include: { product: true } }
        },
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
      include: {
        user: true,
        shippingAddress: true,
        payment: true,
        invoice: true,
        referrals: { include: { influencer: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        reviews: { include: { product: true, user: true }, orderBy: { createdAt: "desc" } },
        items: { include: { product: true } }
      }
    });
  }

  async updateOrderStatus(id: string, status: string, note?: string, changedBy = "admin") {
    const validStatuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    const normalizedStatus = status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const existing = await this.prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!existing) {
      throw new Error("Order not found");
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: normalizedStatus as any },
        include: { user: true, items: { include: { product: true } }, shippingAddress: true, payment: true, invoice: true }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: existing.status as any,
          toStatus: normalizedStatus as any,
          note: note || undefined,
          changedBy
        }
      });

      await tx.notification.create({
        data: {
          channel: "ADMIN",
          type: "ORDER_STATUS_CHANGED",
          entityType: "Order",
          entityId: id,
          title: "Order status updated",
          body: `Order ${id} changed from ${existing.status} to ${normalizedStatus}${note ? `: ${note}` : ""}`,
          status: "PENDING"
        }
      });

      return updated;
    });

    if (order.user?.email) {
      try {
        await this.emailService.sendOrderStatusUpdate(order.user.email, {
          id: order.id,
          orderNumber: order.id,
          customerName: order.user.name || order.user.email,
          status: order.status,
          expectedDelivery: undefined
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email error";
        this.logger.warn(`Order ${order.id} status updated, but status email was not sent: ${message}`);
      }
    }

    return order;
  }

  async generateInvoicePdf(id: string) {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Order not found");
    }

    const invoice = await this.ensureInvoice(order.id);
    const settings = await this.getSettingsValue();
    const payment = order.payment;
    const referral = order.referrals?.[0];
    const lines = [
      `${settings.appName || "Fly Free"} Invoice`,
      `Invoice: ${invoice.invoiceNumber}`,
      `Order: ${order.id}`,
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
      `Business: ${settings.businessName || settings.appName || "Fly Free"}`,
      `GSTIN: ${settings.gstNumber || "Not configured"}`,
      "",
      `Bill To: ${order.user?.name || order.user?.email || "Customer"}`,
      `Email: ${order.user?.email || ""}`,
      `Phone: ${order.user?.phone || ""}`,
      `Address: ${order.shippingAddress?.line1 || ""}, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} ${order.shippingAddress?.postalCode || ""}`,
      "",
      "Payment:",
      `Provider: ${payment?.provider || "RAZORPAY"}`,
      `Status: ${payment?.status || "PENDING"}`,
      `Payment ID: ${payment?.providerPaymentId || "Pending"}`,
      `Paid At: ${payment?.paidAt ? new Date(payment.paidAt).toLocaleString("en-IN") : "Not paid yet"}`,
      "",
      "Items:",
      ...order.items.map((item) => `${item.name} | ${item.sku} | Qty ${item.quantity} | Rs ${this.formatMoney(item.price * item.quantity)}`),
      "",
      `Subtotal: Rs ${this.formatMoney(order.subtotal)}`,
      `Discount: Rs ${this.formatMoney(order.discount)}`,
      `Shipping: Rs ${this.formatMoney(order.shippingFee)}`,
      `GST/Tax: Rs ${this.formatMoney(order.tax)}`,
      `Total: Rs ${this.formatMoney(order.total)}`,
      referral ? `Influencer: ${referral.influencer?.name || referral.code} (${referral.code})` : "",
      "",
      `${settings.businessName || settings.appName || "Fly Free"}`,
      `${settings.businessAddress || settings.address || ""}`,
      `${settings.supportEmail || settings.contactEmail || ""} ${settings.contactPhone || ""}`
    ];

    return this.createSimplePdf(lines);
  }

  async sendInvoiceEmail(id: string) {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.user?.email) {
      throw new Error("Order customer has no email address");
    }

    const invoicePdf = await this.generateInvoicePdf(id);
    const result = await this.emailService.sendInvoice(order.user.email, {
      id: order.id,
      orderNumber: order.invoice?.invoiceNumber || order.id,
      customerName: order.user.name || order.user.email,
      total: order.total
    }, invoicePdf);

    await this.prisma.invoice.update({
      where: { orderId: id },
      data: { sentAt: new Date(), status: "SENT" }
    });

    await this.prisma.notification.create({
      data: {
        channel: "ADMIN",
        type: "INVOICE_SENT",
        entityType: "Order",
        entityId: id,
        title: "Invoice sent",
        body: `Invoice for order ${id} was emailed to ${order.user.email}.`,
        status: "PENDING"
      }
    });

    return result;
  }

  async sendReviewRequest(id: string, message?: string) {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.user?.email) {
      throw new Error("Order customer has no email address");
    }

    const reviewLink = `${process.env.WEB_URL || "http://localhost:3000"}/orders/${order.id}/review`;
    const html = this.wrapAdminEmail(
      "Share your Fly Free review",
      `<p>Hi ${this.escape(order.user.name || "Customer")},</p>
       <p>${this.escape(message || "Please share your feedback for your recent order. It helps us improve and helps other customers choose better.")}</p>
       <p><strong>Order:</strong> ${this.escape(order.id)}</p>
       <p><a href="${this.escape(reviewLink)}" style="display:inline-block;background:#ff6b5b;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:700;">Write review</a></p>`
    );

    const result = await this.emailService.sendEmail(order.user.email, "Review your Fly Free order", html);
    const reviewRequestSentAt = new Date();

    await this.prisma.order.update({
      where: { id },
      data: { reviewRequestSentAt }
    });

    await this.prisma.notification.create({
      data: {
        channel: "ADMIN",
        type: "REVIEW_REQUEST_SENT",
        entityType: "Order",
        entityId: id,
        title: "Review request sent",
        body: `Review link for order ${id} was sent to ${order.user.email}.`,
        status: "PENDING"
      }
    });

    return { ...result, reviewLink, reviewRequestSentAt };
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
        totalOrders: await this.prisma.order.count({ where: { userId: u.id } }),
        totalSpent: (await this.prisma.order.aggregate({ where: { userId: u.id }, _sum: { total: true } }))._sum.total || 0,
        lastOrderDate: (await this.prisma.order.findFirst({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }))?.createdAt || null
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
        orders: {
          include: {
            items: { include: { product: true } },
            payment: true,
            shippingAddress: true,
            referrals: { include: { influencer: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        addresses: true,
        reviews: { include: { product: true }, orderBy: { createdAt: "desc" } },
        wishlistItems: { include: { product: { include: { images: true } } }, orderBy: { createdAt: "desc" } }
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

  async sendUserEmail(id: string, message: string, subject = "Message from Fly Free") {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user?.email) {
      throw new Error("User not found or has no email address");
    }

    return this.emailService.sendEmail(
      user.email,
      subject,
      this.wrapAdminEmail("Message from Fly Free", `<p>Hi ${this.escape(user.name || "Customer")},</p><p>${this.escape(message).replace(/\n/g, "<br/>")}</p>`)
    );
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
      include: { products: { select: { id: true, name: true, slug: true, sku: true }, take: 6 }, announcements: true },
      orderBy: [{ priority: "asc" }, { name: "asc" }]
    });
  }

  async getActiveTheme() {
    const now = new Date();
    return this.prisma.theme.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }]
    });
  }

  async createTheme(data: any) {
    const normalized = this.normalizeThemeData(data);

    return this.prisma.theme.create({
      data: normalized,
      include: { products: true, announcements: true }
    });
  }

  async updateTheme(id: string, data: any) {
    const normalized = this.normalizeThemeData(data, true);

    return this.prisma.theme.update({
      where: { id },
      data: normalized,
      include: { products: true, announcements: true }
    });
  }

  async setActiveTheme(id: string) {
    const theme = await this.prisma.theme.findUnique({ where: { id }, select: { active: true } });
    return this.prisma.theme.update({
      where: { id },
      data: { active: !theme?.active }
    });
  }

  // ==================== PRODUCT THEMES ====================
  async listProductThemes() {
    return this.prisma.theme.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priority: true,
        active: true,
        _count: { select: { products: true } }
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }]
    });
  }

  async createProductTheme(data: any) {
    return this.prisma.theme.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        description: data.description || "",
        priority: data.priority === undefined ? 0 : Number(data.priority),
        active: data.active !== false,
        // Don't set these fields for product themes
        story: "",
        imageUrl: "",
        bannerImageUrl: "",
        primaryColor: "#111827",
        secondaryColor: "#ff6b5b",
        accentColor: "#4ecdc4",
        fontFamily: "Inter, Arial, sans-serif",
        animationStyle: "fade"
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priority: true,
        active: true
      }
    });
  }

  async updateProductTheme(id: string, data: any) {
    return this.prisma.theme.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        priority: data.priority === undefined ? undefined : Number(data.priority),
        active: data.active
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priority: true,
        active: true
      }
    });
  }

  async deleteProductTheme(id: string) {
    const productCount = await this.prisma.product.count({ where: { themeId: id } });
    if (productCount > 0) {
      throw new Error(`Cannot delete theme while ${productCount} product(s) use it.`);
    }

    return this.prisma.theme.delete({ where: { id } });
  }

  async listWebsiteThemes() {
    return this.prisma.websiteTheme.findMany({ orderBy: [{ isActive: "desc" }, { priority: "asc" }, { name: "asc" }] });
  }

  async createWebsiteTheme(data: any) {
    const normalized = this.normalizeWebsiteThemeData(data);

    if (normalized.isActive) {
      return this.prisma.$transaction(async (tx) => {
        await tx.websiteTheme.updateMany({ where: { isActive: true }, data: { isActive: false } });
        return tx.websiteTheme.create({ data: normalized });
      });
    }

    return this.prisma.websiteTheme.create({ data: normalized });
  }

  async updateWebsiteTheme(id: string, data: any) {
    const normalized = this.normalizeWebsiteThemeData(data, true);

    if (normalized.isActive) {
      return this.prisma.$transaction(async (tx) => {
        await tx.websiteTheme.updateMany({ where: { id: { not: id }, isActive: true }, data: { isActive: false } });
        return tx.websiteTheme.update({ where: { id }, data: { ...normalized, isActive: true } });
      });
    }

    return this.prisma.websiteTheme.update({ where: { id }, data: normalized });
  }

  async setActiveWebsiteTheme(id: string) {
    await this.prisma.websiteTheme.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return this.prisma.websiteTheme.update({ where: { id }, data: { isActive: true } });
  }

  async deleteWebsiteTheme(id: string) {
    return this.prisma.websiteTheme.delete({ where: { id } });
  }

  async listAnnouncements() {
    return { data: await this.prisma.announcement.findMany({ include: { theme: true, websiteTheme: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }) };
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({
      data: this.normalizeAnnouncementData(data),
      include: { theme: true, websiteTheme: true }
    });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data: this.normalizeAnnouncementData(data, true),
      include: { theme: true, websiteTheme: true }
    });
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  private normalizeThemeData(data: any, partial = false) {
    const normalized: any = {};
    const set = (key: string, value: any) => {
      if (!partial || value !== undefined) normalized[key] = value;
    };

    set("name", data.name);
    set("slug", data.slug || (data.name ? this.slugify(data.name) : undefined));
    set("description", data.description);
    set("story", data.story);
    set("imageUrl", data.imageUrl);
    set("bannerImageUrl", data.bannerImageUrl);
    set("primaryColor", data.primaryColor);
    set("secondaryColor", data.secondaryColor);
    set("accentColor", data.accentColor);
    set("fontFamily", data.fontFamily);
    set("animationStyle", data.animationStyle);
    set("priority", data.priority === undefined ? undefined : Number(data.priority));
    set("active", data.active);
    set("startsAt", data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined);
    set("endsAt", data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined);

    return normalized;
  }

  private normalizeWebsiteThemeData(data: any, partial = false) {
    const normalized: any = {};
    const set = (key: string, value: any, fallback?: any) => {
      if (partial) {
        if (value !== undefined) normalized[key] = value;
        return;
      }

      normalized[key] = value === undefined || value === "" ? fallback : value;
    };

    set("name", data.name, "Untitled Website Theme");
    set("slug", data.slug || (data.name ? this.slugify(data.name) : undefined), `website-theme-${Date.now()}`);
    set("description", data.description, null);
    set("primaryColor", data.primaryColor, "#111827");
    set("secondaryColor", data.secondaryColor, "#ff6b5b");
    set("backgroundColor", data.backgroundColor, "#f7f3ea");
    set("textColor", data.textColor, "#161616");
    set("accentColor", data.accentColor, "#4ecdc4");
    set("fontFamily", data.fontFamily, "Inter, Arial, sans-serif");
    set("animationStyle", data.animationStyle, "fade");
    set("heroTitle", data.heroTitle, null);
    set("heroSubtitle", data.heroSubtitle, null);
    set("heroDesktopImageUrl", data.heroDesktopImageUrl, null);
    set("heroMobileImageUrl", data.heroMobileImageUrl, null);
    set("heroCtaLabel", data.heroCtaLabel, "Shop now");
    set("heroHref", data.heroHref, "/products");
    set("priority", data.priority === undefined ? undefined : Number(data.priority));
    set("startsAt", data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined);
    set("endsAt", data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined);
    set("isActive", data.isActive, false);

    return normalized;
  }

  private normalizeAnnouncementData(data: any, partial = false) {
    const normalized: any = {};
    const set = (key: string, value: any) => {
      if (!partial || value !== undefined) normalized[key] = value;
    };

    set("title", data.title);
    set("message", data.message);
    set("href", data.href);
    set("imageUrl", data.imageUrl);
    set("ctaLabel", data.ctaLabel);
    set("type", data.type);
    set("priority", data.priority === undefined ? undefined : Number(data.priority));
    set("isActive", data.isActive);
    set("startsAt", data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined);
    set("endsAt", data.endsAt ? new Date(data.endsAt) : data.endsAt === null ? null : undefined);
    set("themeId", data.themeId || (data.themeId === null ? null : undefined));
    set("websiteThemeId", data.websiteThemeId || (data.websiteThemeId === null ? null : undefined));

    return normalized;
  }

  // ==================== SETTINGS ====================
  async getSettings() {
    return { data: await this.getSettingsValue() };
  }

  async updateSettings(data: any) {
    const setting = await this.prisma.appSetting.upsert({
      where: { key: "admin_settings" },
      update: { value: data },
      create: { key: "admin_settings", value: data }
    });

    return { data: setting.value };
  }

  private async getSettingsValue() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    return setting?.value as any || {
      appName: "Fly Free",
      appDescription: "Custom and themed t-shirts for everyday expression.",
      appLogo: "",
      appFavicon: "",
      appTitle: "Fly Free",
      seoTitle: "Fly Free - Custom T-shirts",
      seoDescription: "Shop custom, anime, gaming, Assam, and graphic t-shirts.",
      contactEmail: "support@flyfree.com",
      contactPhone: "9876543210",
      supportEmail: "support@flyfree.com",
      businessName: "Fly Free",
      ownerName: "",
      businessAddress: "",
      invoicePrefix: "INV",
      gstNumber: "",
      footerText: "Fly Free. Designed for comfort and self-expression.",
      socialLinks: {}
    };
  }

  // ==================== PAGES ====================
  async listPages() {
    return { data: await this.prisma.page.findMany({ orderBy: { updatedAt: "desc" } }) };
  }

  async getPage(id: string) {
    return this.prisma.page.findFirst({ where: { OR: [{ id }, { slug: id }] } });
  }

  async createPage(data: any) {
    return this.prisma.page.create({
      data: {
        slug: data.slug || this.slugify(data.title),
        title: data.title,
        content: data.content || "",
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        isPublished: data.isPublished ?? true
      }
    });
  }

  async updatePage(id: string, data: any) {
    return this.prisma.page.update({
      where: { id },
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        isPublished: data.isPublished
      }
    });
  }

  async deletePage(id: string) {
    return this.prisma.page.delete({ where: { id } });
  }

  // ==================== INFLUENCERS ====================
  async listInfluencers() {
    const data = await this.prisma.influencer.findMany({
      include: {
        product: { select: { id: true, name: true, slug: true, sku: true } },
        referrals: { include: { order: true }, orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return { data };
  }

  async getInfluencer(id: string) {
    return this.prisma.influencer.findUnique({
      where: { id },
      include: {
        product: true,
        referrals: { include: { order: { include: { user: true, payment: true } } }, orderBy: { createdAt: "desc" } }
      }
    });
  }

  async createInfluencer(data: any) {
    const code = (data.code || `${this.slugify(data.name).replace(/-/g, "").slice(0, 8)}${Math.floor(Math.random() * 900 + 100)}`).toUpperCase();
    const linkKey = data.linkKey || this.randomKey();
    return this.prisma.influencer.create({
      data: {
        name: data.name,
        email: data.email,
        code,
        linkKey,
        imageUrl: data.imageUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        xUrl: data.xUrl,
        socialHandle: data.socialHandle,
        followers: data.followers ? Number(data.followers) : undefined,
        buyerDiscountPercent: Number(data.buyerDiscountPercent || 10),
        commissionRate: Number(data.commissionRate || 5),
        productId: data.productId || undefined
      },
      include: { product: true, referrals: true }
    });
  }

  async updateInfluencer(id: string, data: any) {
    return this.prisma.influencer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        code: data.code,
        linkKey: data.linkKey,
        imageUrl: data.imageUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        xUrl: data.xUrl,
        socialHandle: data.socialHandle,
        followers: data.followers === undefined ? undefined : Number(data.followers),
        buyerDiscountPercent: data.buyerDiscountPercent === undefined ? undefined : Number(data.buyerDiscountPercent),
        commissionRate: data.commissionRate === undefined ? undefined : Number(data.commissionRate),
        isActive: data.isActive,
        productId: data.productId || null
      },
      include: { product: true, referrals: true }
    });
  }

  async deleteInfluencer(id: string) {
    await this.prisma.referral.deleteMany({ where: { influencerId: id } });
    return this.prisma.influencer.delete({ where: { id } });
  }

  async sendInfluencerCode(id: string) {
    const influencer = await this.prisma.influencer.findUnique({ where: { id } });
    if (!influencer) {
      throw new Error("Influencer not found");
    }
    return this.emailService.sendInfluencerCode(influencer.email, influencer.name, influencer.code, influencer.buyerDiscountPercent);
  }

  // ==================== NOTIFICATIONS ====================
  async listNotifications() {
    const [stored, orders, users, lowStock] = await Promise.all([
      this.prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      this.prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: true, referrals: { include: { influencer: true } } } }),
      this.prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.inventory.findMany({
        where: { stock: { lte: 5 } },
        take: 10,
        include: { variant: { include: { product: true } } },
        orderBy: { updatedAt: "desc" }
      })
    ]);

    const generated = [
      ...orders.map((order) => ({
        id: `order-${order.id}`,
        type: order.referrals.length ? "INFLUENCER_ORDER" : "NEW_ORDER",
        entityType: "Order",
        entityId: order.id,
        title: order.referrals.length ? "New influencer order" : "New order",
        body: `${order.user?.name || order.user?.email || "Customer"} placed order Rs ${this.formatMoney(order.total)}${order.referrals[0]?.influencer ? ` via ${order.referrals[0].influencer.name}` : ""}`,
        status: "GENERATED",
        createdAt: order.createdAt
      })),
      ...users.map((user) => ({
        id: `user-${user.id}`,
        type: "NEW_USER",
        entityType: "User",
        entityId: user.id,
        title: "New user joined",
        body: `${user.name || user.email || user.phone || "Customer"} joined Fly Free`,
        status: "GENERATED",
        createdAt: user.createdAt
      })),
      ...lowStock.map((item) => ({
        id: `stock-${item.id}`,
        type: "LOW_STOCK",
        entityType: "ProductVariant",
        entityId: item.variantId,
        title: "Low stock",
        body: `${item.variant.product.name} ${item.variant.color}/${item.variant.size} has ${item.stock} left`,
        status: "GENERATED",
        createdAt: item.updatedAt
      }))
    ];

    return { data: [...stored, ...generated].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
  }

  async markNotificationRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { status: "READ", readAt: new Date() } });
  }

  private async ensureInvoice(orderId: string) {
    const settings = await this.getSettingsValue();
    const prefix = String(settings.invoicePrefix || "INV").replace(/[^A-Z0-9-]/gi, "").toUpperCase() || "INV";
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const count = await this.prisma.invoice.count();
    return this.prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`
      }
    });
  }

  private createSimplePdf(lines: string[]) {
    const escapedLines = lines.map((line) => this.pdfEscape(line));
    const textCommands = escapedLines
      .map((line, index) => `BT /F1 10 Tf 50 ${780 - index * 16} Td (${line}) Tj ET`)
      .join("\n");
    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${Buffer.byteLength(textCommands, "utf8")} >> stream\n${textCommands}\nendstream endobj`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, "utf8"));
      pdf += `${object}\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, "utf8");
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let index = 1; index < offsets.length; index++) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, "utf8");
  }

  private pdfEscape(value: string) {
    return String(value).replace(/[\\()]/g, "\\$&").slice(0, 120);
  }

  private wrapAdminEmail(title: string, body: string) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">
        <div style="background:#111827;color:#fff;padding:22px 24px;">
          <h1 style="margin:0;font-size:24px;">${this.escape(title)}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,.72);">Fly Free</p>
        </div>
        <div style="background:#fafafa;padding:24px;">${body}</div>
      </div>
    `;
  }

  private escape(value: string) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private randomKey() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  private formatMoney(value: number) {
    return Number(value || 0).toLocaleString("en-IN");
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

  // ==================== SIZE GUIDES ====================
  async listSizeGuides() {
    return await this.prisma.sizeGuide.findMany({
      orderBy: { priority: "asc" }
    });
  }

  async createSizeGuide(data: any) {
    return await this.prisma.sizeGuide.create({
      data: {
        size: data.size,
        chest: data.chest,
        shoulder: data.shoulder,
        length: data.length,
        sleeve: data.sleeve,
        priority: data.priority || 0,
        active: data.active !== false
      }
    });
  }

  async updateSizeGuide(id: string, data: any) {
    return await this.prisma.sizeGuide.update({
      where: { id },
      data: {
        size: data.size,
        chest: data.chest,
        shoulder: data.shoulder,
        length: data.length,
        sleeve: data.sleeve,
        priority: data.priority,
        active: data.active
      }
    });
  }

  async deleteSizeGuide(id: string) {
    return await this.prisma.sizeGuide.delete({
      where: { id }
    });
  }

  // ==================== HERO BANNERS ====================
  async listHeroBanners() {
    return await this.prisma.heroBanner.findMany({
      orderBy: { priority: "asc" }
    });
  }

  async createHeroBanner(data: any) {
    const input: any = {
      title: data.title,
      imageUrl: data.imageUrl,
      priority: data.priority || 0,
      isActive: data.isActive !== false
    };

    if (data.subtitle) input.subtitle = data.subtitle;
    if (data.mobileImageUrl) input.mobileImageUrl = data.mobileImageUrl;
    if (data.ctaLabel) input.ctaLabel = data.ctaLabel;
    if (data.ctaHref) input.ctaHref = data.ctaHref;
    if (data.startsAt) input.startsAt = new Date(data.startsAt);
    if (data.endsAt) input.endsAt = new Date(data.endsAt);

    return await this.prisma.heroBanner.create({ data: input });
  }

  async updateHeroBanner(id: string, data: any) {
    const input: any = {};

    if (data.title !== undefined) input.title = data.title;
    if (data.subtitle !== undefined) input.subtitle = data.subtitle;
    if (data.imageUrl !== undefined) input.imageUrl = data.imageUrl;
    if (data.mobileImageUrl !== undefined) input.mobileImageUrl = data.mobileImageUrl;
    if (data.ctaLabel !== undefined) input.ctaLabel = data.ctaLabel;
    if (data.ctaHref !== undefined) input.ctaHref = data.ctaHref;
    if (data.priority !== undefined) input.priority = data.priority;
    if (data.isActive !== undefined) input.isActive = data.isActive;
    if (data.startsAt !== undefined) input.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) input.endsAt = data.endsAt ? new Date(data.endsAt) : null;

    return await this.prisma.heroBanner.update({
      where: { id },
      data: input
    });
  }

  async deleteHeroBanner(id: string) {
    return await this.prisma.heroBanner.delete({
      where: { id }
    });
  }
}
