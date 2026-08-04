import { BadRequestException, Injectable, Logger } from "@nestjs/common";

/** Drawing primitives for the hand-rolled invoice PDF. Origin is bottom-left. */
type PdfRgb = [number, number, number];
type PdfOp =
  | { kind: "text"; text: string; x: number; y: number; size: number; bold?: boolean; color?: PdfRgb; align?: "left" | "right" }
  | { kind: "rect"; x: number; y: number; width: number; height: number; color: PdfRgb };
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { createClient } from "@supabase/supabase-js";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { STANDARD_PAGES, STANDARD_PAGE_SLUGS } from "../cms/standard-pages";

/** Every admin-uploaded image lands here. The bucket must be public. */
const STORAGE_BUCKET = "product-images";

/**
 * Prisma's default interactive-transaction deadline is 5s, which is fine
 * against a local database and marginal against a managed one in another
 * region. Editors save large products with many variants, so give the write
 * real headroom rather than failing the save.
 */
const TRANSACTION_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

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

    if (Array.isArray(data.variants)) {
      data = {
        ...data,
        variants: data.variants.map((variant: any, index: number) => ({
          ...variant,
          sku: this.variantSku(variant, data, index)
        }))
      };
      await this.assertVariantSkusAvailable(data.variants, "");
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        sku: data.sku || `SKU-${Date.now()}`,
        description: data.description || "",
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
        collectionId: data.collectionId || null,
        // Themes are optional: a product with no theme still lists on the site.
        themeId: data.themeId || null,
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

  /**
   * Replaces a product and its child rows.
   *
   * Round trips are the budget here: the database is remote, so every extra
   * query inside the transaction is another ~100ms against the interactive
   * transaction deadline. Two things keep this bounded:
   *
   *  - variants are written with two `createMany` calls (ids generated here so
   *    inventory can reference them) instead of a nested `create` per variant,
   *    which cost two round trips *each*;
   *  - the fully-populated product is re-read after the transaction commits,
   *    so those joins are not on the clock.
   */
  async updateProduct(id: string, data: any) {
    const variants = Array.isArray(data.variants)
      ? data.variants.map((variant: any, index: number) => ({
          id: randomUUID(),
          productId: id,
          sku: this.variantSku(variant, data, index),
          color: variant.color,
          size: variant.size,
          price: variant.price ? Number(variant.price) : null,
          stock: Number(variant.stock || 0),
          lowStockAlert: Number(variant.lowStockAlert || 5),
          warehouse: variant.warehouse || null,
          barcode: variant.barcode || null
        }))
      : null;

    // ProductVariant.sku is globally unique. Checked up front so a clash is a
    // clear 400 naming the SKU, not a 500 from a half-run transaction.
    if (variants) {
      await this.assertVariantSkusAvailable(variants, id);
    }

    await this.prisma.$transaction(
      async (tx: any) => {
        if (variants) {
          // Relation filter, so the variant ids do not need a separate read.
          await tx.inventory.deleteMany({ where: { variant: { productId: id } } });
          await tx.productVariant.deleteMany({ where: { productId: id } });
        }

        if (Array.isArray(data.images)) {
          await tx.productImage.deleteMany({ where: { productId: id } });
        }

        if (Array.isArray(data.hampers)) {
          await tx.productHamper.deleteMany({ where: { productId: id } });
        }

        await tx.product.update({
          where: { id },
          data: {
            name: data.name,
            slug: data.slug,
            sku: data.sku,
            description: data.description,
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
            // "" from an unset dropdown must clear the link, not fail the FK.
            collectionId: data.collectionId === undefined ? undefined : data.collectionId || null,
            themeId: data.themeId === undefined ? undefined : data.themeId || null,
            images: Array.isArray(data.images) ? { createMany: { data: data.images } } : undefined,
            hampers: Array.isArray(data.hampers)
              ? {
                  createMany: {
                    data: data.hampers.map((hamper: any, index: number) =>
                      this.normalizeProductHamperData(hamper, index)
                    )
                  }
                }
              : undefined
          }
        });

        if (variants && variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map(({ stock, lowStockAlert, warehouse, barcode, ...variant }: any) => variant)
          });
          await tx.inventory.createMany({
            data: variants.map((variant: any) => ({
              variantId: variant.id,
              stock: variant.stock,
              lowStockAlert: variant.lowStockAlert,
              warehouse: variant.warehouse,
              barcode: variant.barcode
            }))
          });
        }
      },
      TRANSACTION_OPTIONS
    );

    return this.getProduct(id);
  }

  async deleteProduct(id: string) {
    return this.prisma.$transaction(async (tx: any) => {
      await tx.inventory.deleteMany({ where: { variant: { productId: id } } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productHamper.deleteMany({ where: { productId: id } });
      return tx.product.delete({ where: { id } });
    }, TRANSACTION_OPTIONS);
  }

  /**
   * Falls back to a derived SKU when the editor leaves the field blank, so a
   * row of empty strings cannot collide with the next one.
   */
  private variantSku(variant: any, product: any, index: number) {
    const provided = String(variant?.sku ?? "").trim();
    if (provided) return provided;

    const base = String(product?.sku || this.slugify(product?.name || "product")).toUpperCase();
    const parts = [variant?.color, variant?.size]
      .map((part) => String(part ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-"))
      .filter(Boolean);

    return [base, ...(parts.length ? parts : [`V${index + 1}`])].join("-");
  }

  /**
   * Rejects duplicates inside the payload and SKUs already held by a different
   * product. Runs before the transaction so it costs nothing on the deadline.
   */
  private async assertVariantSkusAvailable(variants: Array<{ sku: string }>, productId: string) {
    const seen = new Set<string>();
    const duplicated = new Set<string>();

    for (const { sku } of variants) {
      if (seen.has(sku)) duplicated.add(sku);
      seen.add(sku);
    }

    if (duplicated.size) {
      throw new BadRequestException(
        `Duplicate variant SKU in this product: ${[...duplicated].join(", ")}. Every variant needs its own SKU.`
      );
    }

    if (!seen.size) return;

    const clashes = await this.prisma.productVariant.findMany({
      where: { sku: { in: [...seen] }, productId: { not: productId } },
      select: { sku: true, product: { select: { name: true } } }
    });

    if (clashes.length) {
      const detail = clashes
        .map((clash: any) => `${clash.sku} (used by "${clash.product?.name ?? "another product"}")`)
        .join(", ");
      throw new BadRequestException(`These variant SKUs already exist: ${detail}.`);
    }
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
      where: { slug: "regular" },
      update: {},
      create: { name: "Regular", slug: "regular", priority: 1 }
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
      data: orders.map((order) => this.withShippingAddress(order)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        payment: true,
        invoice: true,
        referrals: { include: { influencer: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        reviews: { include: { product: true, user: true }, orderBy: { createdAt: "desc" } },
        items: { include: { product: true } }
      }
    });

    return order ? this.withShippingAddress(order) : order;
  }

  /**
   * The delivery address is snapshotted onto the order as flat `shipping*`
   * columns at checkout, so it survives the customer deleting the address book
   * entry. Admin screens and the storefront both expect it as one nested
   * object, so expose it in both shapes — with the same field aliases the
   * storefront uses, so a component can be moved between apps unchanged.
   */
  private withShippingAddress(order: any) {
    const hasAddress = Boolean(
      order.shippingName || order.shippingLine1 || order.shippingCity || order.shippingPostalCode
    );

    return {
      ...order,
      shippingAddress: hasAddress
        ? {
            name: order.shippingName,
            fullName: order.shippingName,
            phone: order.shippingPhone,
            street: order.shippingLine1,
            line1: order.shippingLine1,
            line2: order.shippingLine2,
            city: order.shippingCity,
            state: order.shippingState,
            pincode: order.shippingPostalCode,
            postalCode: order.shippingPostalCode,
            country: order.shippingCountry
          }
        : null
    };
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

    try {
      // Simple update without includes first
      const order = await this.prisma.order.update({
        where: { id },
        data: { status: normalizedStatus as any }
      });

      // Fetch full order data after update
      const fullOrder = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          payment: true,
          invoice: true,
          reviews: { include: { user: true, product: true } },
          referrals: { include: { influencer: true } },
          statusHistory: true
        }
      });

      // Create status history (non-critical)
      try {
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: existing.status as any,
            toStatus: normalizedStatus as any,
            note: note || undefined,
            changedBy
          }
        });
      } catch (error) {
        this.logger.warn(`Failed to create status history for order ${id}:`, error);
      }

      // Create notification (non-critical)
      try {
        await this.prisma.notification.create({
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
      } catch (error) {
        this.logger.warn(`Failed to create notification for order ${id}:`, error);
      }

      // Send email (non-critical) - Get user from database
      if (order.userId) {
        try {
          const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
          if (user?.email) {
            await this.emailService.sendOrderStatusUpdate(user.email, {
              id: order.id,
              orderNumber: order.id,
              customerName: user.name || user.email,
              status: order.status,
              expectedDelivery: undefined
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown email error";
          this.logger.warn(`Order ${order.id} status updated, but status email was not sent: ${message}`);
        }
      }

      return fullOrder || order;
    } catch (error) {
      this.logger.error(`Failed to update order status for ${id}:`, error);
      throw error;
    }
  }

  async generateInvoicePdf(id: string) {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Order not found");
    }

    const invoice = await this.ensureInvoice(order.id);
    const settings = await this.getSettingsValue();

    const brand = settings.businessName || settings.appName || "Fly Free";
    const accent: PdfRgb = [1, 0.29, 0.31]; // brand red
    const ink: PdfRgb = [0.07, 0.09, 0.15];
    const muted: PdfRgb = [0.42, 0.45, 0.5];
    const hairline: PdfRgb = [0.88, 0.89, 0.91];

    const money = (value: number) => `Rs ${this.formatMoney(value)}`;
    const ops: PdfOp[] = [];

    // ---- header band
    ops.push({ kind: "rect", x: 0, y: 742, width: 595, height: 100, color: ink });
    ops.push({ kind: "text", text: brand, x: 50, y: 800, size: 26, bold: true, color: [1, 1, 1] });
    ops.push({ kind: "text", text: "TAX INVOICE", x: 50, y: 776, size: 10, color: [0.75, 0.77, 0.8] });
    ops.push({ kind: "text", text: invoice.invoiceNumber, x: 545, y: 800, size: 14, bold: true, color: [1, 1, 1], align: "right" });
    ops.push({
      kind: "text",
      text: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      x: 545, y: 778, size: 10, color: [0.75, 0.77, 0.8], align: "right"
    });

    // ---- meta row
    let y = 706;
    ops.push({ kind: "text", text: "ORDER NUMBER", x: 50, y, size: 8, bold: true, color: muted });
    ops.push({ kind: "text", text: "PAYMENT", x: 300, y, size: 8, bold: true, color: muted });
    y -= 15;
    ops.push({ kind: "text", text: order.orderNumber || order.id, x: 50, y, size: 11, bold: true, color: ink });

    const payment: any = order.payment;
    const paymentStatus = payment?.status || "PENDING";
    ops.push({ kind: "text", text: `${payment?.provider || "RAZORPAY"} / ${paymentStatus}`, x: 300, y, size: 11, bold: true, color: ink });
    if (payment?.providerPaymentId) {
      y -= 13;
      ops.push({ kind: "text", text: payment.providerPaymentId, x: 300, y, size: 8, color: muted });
    }

    // ---- billing
    y -= 34;
    ops.push({ kind: "text", text: "BILL TO", x: 50, y, size: 8, bold: true, color: muted });
    ops.push({ kind: "text", text: "FROM", x: 300, y, size: 8, bold: true, color: muted });

    const billTo = [
      order.shippingName || order.user?.name || "Customer",
      order.user?.email || "",
      order.shippingPhone || order.user?.phone || "",
      [order.shippingLine1, order.shippingLine2].filter(Boolean).join(", "),
      [order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join(", "),
      order.shippingCountry || "India"
    ].filter(Boolean);

    const from = [
      brand,
      settings.businessAddress || "",
      settings.supportEmail || settings.contactEmail || "",
      settings.contactPhone || "",
      settings.gstNumber ? `GSTIN: ${settings.gstNumber}` : ""
    ].filter(Boolean);

    const blockTop = y - 16;
    billTo.forEach((line, index) => {
      ops.push({ kind: "text", text: line, x: 50, y: blockTop - index * 13, size: 9, bold: index === 0, color: index === 0 ? ink : muted });
    });
    from.forEach((line, index) => {
      ops.push({ kind: "text", text: line, x: 300, y: blockTop - index * 13, size: 9, bold: index === 0, color: index === 0 ? ink : muted });
    });

    // ---- items table
    y = blockTop - Math.max(billTo.length, from.length) * 13 - 26;
    ops.push({ kind: "rect", x: 50, y: y - 6, width: 495, height: 22, color: [0.96, 0.96, 0.97] });
    ops.push({ kind: "text", text: "ITEM", x: 58, y, size: 8, bold: true, color: muted });
    ops.push({ kind: "text", text: "QTY", x: 400, y, size: 8, bold: true, color: muted, align: "right" });
    ops.push({ kind: "text", text: "PRICE", x: 470, y, size: 8, bold: true, color: muted, align: "right" });
    ops.push({ kind: "text", text: "AMOUNT", x: 537, y, size: 8, bold: true, color: muted, align: "right" });

    y -= 24;
    for (const item of order.items as any[]) {
      ops.push({ kind: "text", text: String(item.name).slice(0, 46), x: 58, y, size: 10, color: ink });
      ops.push({ kind: "text", text: String(item.quantity), x: 400, y, size: 10, color: ink, align: "right" });
      ops.push({ kind: "text", text: money(item.price), x: 470, y, size: 10, color: ink, align: "right" });
      ops.push({ kind: "text", text: money(item.price * item.quantity), x: 537, y, size: 10, bold: true, color: ink, align: "right" });

      if (item.sku) {
        y -= 12;
        ops.push({ kind: "text", text: `SKU ${item.sku}`, x: 58, y, size: 8, color: muted });
      }

      y -= 10;
      ops.push({ kind: "rect", x: 50, y: y + 2, width: 495, height: 0.6, color: hairline });
      y -= 16;
    }

    // ---- totals
    y -= 6;
    const totalsRow = (label: string, value: string, bold = false) => {
      ops.push({ kind: "text", text: label, x: 430, y, size: 10, bold, color: bold ? ink : muted, align: "right" });
      ops.push({ kind: "text", text: value, x: 537, y, size: 10, bold, color: ink, align: "right" });
      y -= 17;
    };

    totalsRow("Subtotal", money(order.subtotal));
    if (order.discount > 0) totalsRow("Discount", `- ${money(order.discount)}`);
    totalsRow("Delivery", order.shippingFee > 0 ? money(order.shippingFee) : "FREE");

    ops.push({ kind: "rect", x: 340, y: y + 12, width: 205, height: 0.8, color: hairline });
    y -= 6;
    ops.push({ kind: "text", text: "TOTAL", x: 430, y, size: 12, bold: true, color: ink, align: "right" });
    ops.push({ kind: "text", text: money(order.total), x: 537, y, size: 14, bold: true, color: accent, align: "right" });

    // ---- footer
    ops.push({ kind: "rect", x: 50, y: 96, width: 495, height: 0.8, color: hairline });
    ops.push({ kind: "text", text: "Prices are inclusive. No additional tax is charged.", x: 50, y: 78, size: 8, color: muted });
    ops.push({ kind: "text", text: "Exchange available within 30 days of delivery. We do not offer returns or refunds.", x: 50, y: 65, size: 8, color: muted });
    ops.push({ kind: "text", text: `Questions? ${settings.supportEmail || settings.contactEmail || "support@flyfree.com"}`, x: 50, y: 52, size: 8, color: muted });
    ops.push({ kind: "text", text: `Thank you for shopping with ${brand}.`, x: 537, y: 52, size: 9, bold: true, color: ink, align: "right" });

    return this.renderPdf(ops);
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
    const invoice = await this.ensureInvoice(order.id);

    const result = await this.emailService.sendInvoice(order.user.email, {
      id: order.id,
      // The customer recognises the order number; the invoice number is separate.
      orderNumber: order.orderNumber || order.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: order.user.name || order.user.email,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
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

    const reviewLink = `${this.emailService.webUrl()}/orders/${order.id}/review`;
    const html = this.wrapAdminEmail(
      "Share your Fly Free review",
      `<p>Hi ${this.escape(order.user.name || "Customer")},</p>
       <p>${this.escape(message || "Please share your feedback for your recent order. It helps us improve and helps other customers choose better.")}</p>
       <p><strong>Order:</strong> ${this.escape(order.orderNumber || order.id)}</p>
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
      users.map(async (u: any) => ({
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
      data: reviews.map((review: any) => ({
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
  // Everything the theme editor needs, so an edit round-trips without loss.
  private readonly productThemeSelect = {
    id: true,
    name: true,
    slug: true,
    description: true,
    story: true,
    imageUrl: true,
    bannerImageUrl: true,
    primaryColor: true,
    secondaryColor: true,
    accentColor: true,
    priority: true,
    active: true
  };

  async listProductThemes() {
    return this.prisma.theme.findMany({
      select: { ...this.productThemeSelect, _count: { select: { products: true } } },
      orderBy: [{ priority: "asc" }, { name: "asc" }]
    });
  }

  async createProductTheme(data: any) {
    return this.prisma.theme.create({
      data: {
        name: data.name,
        slug: data.slug || this.slugify(data.name),
        description: data.description || "",
        story: data.story || "",
        imageUrl: data.imageUrl || "",
        bannerImageUrl: data.bannerImageUrl || "",
        primaryColor: data.primaryColor || "#111827",
        secondaryColor: data.secondaryColor || "#FF4A4E",
        accentColor: data.accentColor || "#FFB703",
        fontFamily: "Inter, Arial, sans-serif",
        animationStyle: "fade",
        priority: data.priority === undefined ? 0 : Number(data.priority),
        active: data.active !== false
      },
      select: this.productThemeSelect
    });
  }

  async updateProductTheme(id: string, data: any) {
    // Only touch the keys the editor actually sent.
    const patch: any = {};
    for (const key of [
      "name",
      "slug",
      "description",
      "story",
      "imageUrl",
      "bannerImageUrl",
      "primaryColor",
      "secondaryColor",
      "accentColor"
    ]) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    if (data.priority !== undefined) patch.priority = Number(data.priority);
    if (data.active !== undefined) patch.active = data.active;

    return this.prisma.theme.update({
      where: { id },
      data: patch,
      select: this.productThemeSelect
    });
  }

  async deleteProductTheme(id: string) {
    const productCount = await this.prisma.product.count({ where: { themeId: id } });
    if (productCount > 0) {
      throw new Error(`Cannot delete theme while ${productCount} product(s) use it.`);
    }

    return this.prisma.theme.delete({ where: { id } });
  }

  async listAnnouncements() {
    return { data: await this.prisma.announcement.findMany({ include: { theme: true }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }) };
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({
      data: this.normalizeAnnouncementData(data),
      include: { theme: true }
    });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data: this.normalizeAnnouncementData(data, true),
      include: { theme: true }
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
      // Delivery is the only charge added on top of the item total.
      // Orders at or above the threshold ship free. Values are in rupees.
      deliveryFee: 60,
      freeDeliveryAbove: 1000,
      footerText: "Fly Free. Designed for comfort and self-expression.",
      socialLinks: {}
    };
  }

  /**
   * Store an image and return its public URL. Browser-side uploads are blocked
   * by storage RLS, so the server does it with the service-role key.
   */
  async uploadImage(image: string, folder = "misc") {
    const match = /^data:([a-z/+-]+);base64,(.+)$/i.exec(image || "");
    if (!match) {
      throw new BadRequestException("Image must be a base64 data URL");
    }

    const [, mimeType, base64] = match;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType.toLowerCase())) {
      throw new BadRequestException(`Unsupported image type: ${mimeType}`);
    }

    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength > 12 * 1024 * 1024) {
      throw new BadRequestException("Image must be under 12MB");
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      // Name the missing variable — this runs on the API host (Railway), not on
      // Vercel, and that distinction is where the setup usually goes wrong.
      const missing = [
        !url && "SUPABASE_URL",
        !serviceKey && "SUPABASE_SERVICE_ROLE_KEY"
      ].filter(Boolean);
      this.logger.error(`Image upload blocked: missing ${missing.join(" and ")} on the API server`);
      throw new BadRequestException(
        `Image storage is not configured: ${missing.join(" and ")} missing on the API server. Set it where the API is deployed, not on the frontend host.`
      );
    }

    const storage = createClient(url, serviceKey);
    const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "misc";
    const objectPath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

    const { data, error } = await storage.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      this.logger.error(`Admin image upload failed: ${error.message}`);
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }

    const { data: pub } = storage.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return { url: pub.publicUrl };
  }

  /**
   * Read-only health check for image storage, so a failing upload can be
   * diagnosed without uploading anything.
   *
   * Uploads are performed by THIS server, so the credentials must exist on the
   * API host. Setting them on the frontend host has no effect — and the
   * service-role key must never be shipped to a browser.
   */
  async getStorageStatus() {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const status: Record<string, any> = {
      bucket: STORAGE_BUCKET,
      supabaseUrl: url || null,
      hasSupabaseUrl: Boolean(url),
      hasServiceRoleKey: Boolean(serviceKey),
      bucketReachable: false,
      isPublic: null as boolean | null,
      ok: false,
      error: null as string | null
    };

    if (!url || !serviceKey) {
      status.error = `Missing ${[!url && "SUPABASE_URL", !serviceKey && "SUPABASE_SERVICE_ROLE_KEY"]
        .filter(Boolean)
        .join(" and ")} on the API server.`;
      return status;
    }

    try {
      const storage = createClient(url, serviceKey);
      const { data, error } = await storage.storage.getBucket(STORAGE_BUCKET);

      if (error) {
        status.error = error.message;
        return status;
      }

      status.bucketReachable = true;
      status.isPublic = data?.public ?? null;
      status.ok = Boolean(data?.public);
      if (!data?.public) {
        status.error = `Bucket "${STORAGE_BUCKET}" exists but is not public, so uploaded images will not load.`;
      }
    } catch (err) {
      status.error = err instanceof Error ? err.message : "Could not reach Supabase storage";
    }

    return status;
  }

  /** Best-effort removal of a previously uploaded image. */
  async deleteImage(url: string) {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const index = (url || "").indexOf(marker);
    if (index === -1) return { removed: false };

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return { removed: false };

    const storage = createClient(supabaseUrl, serviceKey);
    const { error } = await storage.storage
      .from(STORAGE_BUCKET)
      .remove([url.slice(index + marker.length)]);

    if (error) {
      this.logger.warn(`Could not remove image: ${error.message}`);
      return { removed: false };
    }

    return { removed: true };
  }

  // Public delivery config, used by the cart and checkout to price shipping.
  async getDeliverySettings() {
    const settings = await this.getSettingsValue();
    return {
      deliveryFee: Number(settings.deliveryFee ?? 60),
      freeDeliveryAbove: Number(settings.freeDeliveryAbove ?? 1000)
    };
  }

  // ==================== PAGES ====================
  async listPages() {
    const pages = await this.prisma.page.findMany({ orderBy: { updatedAt: "desc" } });
    const bySlug = new Map(pages.map((page) => [page.slug, page]));

    return {
      data: pages,
      // Lets the admin show which storefront pages exist and which are still
      // falling back to hard-coded copy, without hardcoding slugs in the UI.
      standard: STANDARD_PAGES.map((page) => ({
        slug: page.slug,
        title: page.title,
        route: page.route,
        exists: bySlug.has(page.slug),
        isPublished: bySlug.get(page.slug)?.isPublished ?? false
      }))
    };
  }

  /**
   * Creates any storefront page that does not exist yet, with starter content.
   * Existing pages are left untouched, so this is safe to re-run.
   */
  async createMissingPages() {
    const existing = await this.prisma.page.findMany({
      where: { slug: { in: STANDARD_PAGE_SLUGS } },
      select: { slug: true }
    });
    const have = new Set(existing.map((page) => page.slug));
    const missing = STANDARD_PAGES.filter((page) => !have.has(page.slug));

    if (missing.length > 0) {
      await this.prisma.page.createMany({
        data: missing.map((page) => ({
          slug: page.slug,
          title: page.title,
          content: page.content,
          metaTitle: page.title,
          isPublished: true
        }))
      });
    }

    return { created: missing.map((page) => page.slug), skipped: existing.length };
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
        products: true,
        referrals: { include: { order: true }, orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return { data };
  }

  async getInfluencer(id: string) {
    const influencer = await this.prisma.influencer.findUnique({
      where: { id },
      include: {
        products: true,
        referrals: { include: { order: { include: { user: true, payment: true } } }, orderBy: { createdAt: "desc" } }
      }
    });
    return influencer ? { ...influencer, product: influencer.products[0] || null } : null;
  }

  async createInfluencer(data: any) {
    const code = (data.code || `${this.slugify(data.name).replace(/-/g, "").slice(0, 8)}${Math.floor(Math.random() * 900 + 100)}`).toUpperCase();
    const linkKey = data.linkKey || this.randomKey();
    const productIds = this.normalizeProductIds(data.productIds ?? data.productId);
    const influencer = await this.prisma.influencer.create({
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
        products: productIds.length ? { connect: productIds.map((productId) => ({ id: productId })) } : undefined
      },
      include: { products: true, referrals: true }
    });
    return { ...influencer, product: influencer.products[0] || null };
  }

  async updateInfluencer(id: string, data: any) {
    const updateData: any = {
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
      isActive: data.isActive
    };

    if (data.productIds !== undefined || data.productId !== undefined) {
      const productIds = this.normalizeProductIds(data.productIds ?? data.productId);
      updateData.products = { set: productIds.map((productId) => ({ id: productId })) };
    }

    const influencer = await this.prisma.influencer.update({
      where: { id },
      data: updateData,
      include: { products: true, referrals: true }
    });
    return { ...influencer, product: influencer.products[0] || null };
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

  async assignInfluencerProducts(id: string, productIds: string[]) {
    return this.prisma.influencer.update({
      where: { id },
      data: {
        products: { set: this.normalizeProductIds(productIds).map((productId) => ({ id: productId })) }
      },
      include: { products: { select: { id: true, name: true, price: true } } }
    });
  }

  async getInfluencerWithProducts(id: string) {
    return this.prisma.influencer.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true, price: true, images: { take: 1 } } } }
    });
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
      ...orders.map((order: any) => ({
        id: `order-${order.id}`,
        type: order.referrals.length ? "INFLUENCER_ORDER" : "NEW_ORDER",
        entityType: "Order",
        entityId: order.id,
        title: order.referrals.length ? "New influencer order" : "New order",
        body: `${order.user?.name || order.user?.email || "Customer"} placed order Rs ${this.formatMoney(order.total)}${order.referrals[0]?.influencer ? ` via ${order.referrals[0].influencer.name}` : ""}`,
        status: "GENERATED",
        createdAt: order.createdAt
      })),
      ...users.map((user: any) => ({
        id: `user-${user.id}`,
        type: "NEW_USER",
        entityType: "User",
        entityId: user.id,
        title: "New user joined",
        body: `${user.name || user.email || user.phone || "Customer"} joined Fly Free`,
        status: "GENERATED",
        createdAt: user.createdAt
      })),
      ...lowStock.map((item: any) => ({
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

  /**
   * Assemble a single-page A4 PDF from drawing operations. Written by hand so
   * the service carries no PDF dependency; supports regular/bold text at any
   * size and position, right alignment, filled rectangles, and rules.
   */
  private renderPdf(ops: PdfOp[]) {
    // Helvetica character widths are ~0.5em on average; good enough to right-align.
    const textWidth = (text: string, size: number) => text.length * size * 0.5;

    const stream = ops
      .map((op) => {
        if (op.kind === "rect") {
          const [r, g, b] = op.color;
          return `${r} ${g} ${b} rg ${op.x} ${op.y} ${op.width} ${op.height} re f`;
        }

        const font = op.bold ? "/F2" : "/F1";
        const [r, g, b] = op.color ?? [0, 0, 0];
        const x = op.align === "right" ? op.x - textWidth(op.text, op.size) : op.x;
        return `BT ${r} ${g} ${b} rg ${font} ${op.size} Tf ${x.toFixed(1)} ${op.y} Td (${this.pdfEscape(op.text)}) Tj ET`;
      })
      .join("\n");

    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`,
      "6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj"
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

  /**
   * PDF string literals use the base Helvetica encoding, so anything outside
   * Latin-1 renders as mojibake. Map the punctuation we actually use to ASCII
   * and drop the rest rather than emitting broken glyphs.
   */
  private pdfEscape(value: string) {
    return String(value)
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/·/g, "-")
      .replace(/₹/g, "Rs ")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[\\()]/g, "\\$&")
      .slice(0, 120);
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

  private normalizeProductIds(value: unknown): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return Array.from(new Set(values.map((item) => String(item).trim()).filter(Boolean)));
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
      recentOrders: recentOrders.map((order: any, index: number) => ({
        id: order.id,
        orderNumber: `ORD-${String(index + 1).padStart(3, "0")}`,
        customer: order.user?.name || order.user?.email || "Customer",
        amount: order.total,
        status: order.status,
        paymentStatus: order.payment?.status || "PENDING",
        createdAt: order.createdAt
      })),
      charts: {
        orderStatus: orderStatusCounts.map((item: any) => ({
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

  // ==================== HAMPERS ====================
  async listHampers() {
    return await this.prisma.productHamper.findMany({
      orderBy: { priority: "asc" },
      include: { product: true, theme: true }
    });
  }

  // A hamper attaches to either a single product or a whole theme, never both.
  async createHamper(data: any) {
    return await this.prisma.productHamper.create({
      data: {
        productId: data.productId || null,
        themeId: data.themeId || null,
        name: data.name,
        description: data.description || null,
        contents: data.contents || [],
        imageUrl: data.imageUrl || null,
        images: data.images || [],
        sizeNote: data.sizeNote || null,
        price: data.price || 0,
        gstPercent: data.gstPercent || 5,
        isActive: data.isActive !== false,
        priority: data.priority || 0
      },
      include: { product: true, theme: true }
    });
  }

  async updateHamper(id: string, data: any) {
    const updateData: any = {};

    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.themeId !== undefined) updateData.themeId = data.themeId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.contents !== undefined) updateData.contents = data.contents;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.sizeNote !== undefined) updateData.sizeNote = data.sizeNote;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.gstPercent !== undefined) updateData.gstPercent = data.gstPercent;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.priority !== undefined) updateData.priority = data.priority;

    return await this.prisma.productHamper.update({
      where: { id },
      data: updateData,
      include: { product: true, theme: true }
    });
  }

  async deleteHamper(id: string) {
    return await this.prisma.productHamper.delete({
      where: { id }
    });
  }

}
