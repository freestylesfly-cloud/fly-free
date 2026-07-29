import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class EcommerceService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  // ==================== WISHLIST ====================
  async getWishlist(token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: { include: { images: true } } }
    });
  }

  async addToWishlist(productId: string, token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.wishlist.create({
      data: { userId, productId }
    });
  }

  async removeFromWishlist(productId: string, token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.wishlist.deleteMany({
      where: { userId, productId }
    });
  }

  // ==================== CART ====================
  async getCart(token: string) {
    const userId = this.extractUserId(token);
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true }
      });
    }

    return cart;
  }

  async addToCart(productId: string, variantId: string, quantity: number, token: string) {
    const userId = this.extractUserId(token);

    // Get or create cart
    let cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // Check if item already in cart
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId }
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity }
      });
    }

    return this.prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity }
    });
  }

  async updateCartItem(cartItemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });
  }

  async removeFromCart(cartItemId: string) {
    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(token: string) {
    const userId = this.extractUserId(token);
    const cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (cart) {
      return this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  // ==================== REVIEWS ====================
  async getProductReviews(productId: string, page: number = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: "APPROVED" },
        skip,
        take: limit,
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.review.count({ where: { productId, status: "APPROVED" } })
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async createReview(productId: string, rating: number, title: string, comment: string, token: string) {
    const userId = this.extractUserId(token);

    return this.prisma.review.create({
      data: { productId, userId, rating, title, body: comment, status: "PENDING" }
    });
  }

  async updateReview(reviewId: string, data: any) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { title: data.title, body: data.body || data.comment, rating: data.rating }
    });
  }

  async deleteReview(reviewId: string) {
    return this.prisma.review.delete({ where: { id: reviewId } });
  }

  // ==================== ADDRESSES ====================
  async getAddresses(token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.address.findMany({ where: { userId } });
  }

  async createAddress(data: any, token: string) {
    const userId = this.extractUserId(token);
    return this.prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || "India"
      }
    });
  }

  async updateAddress(addressId: string, data: any, token: string) {
    const userId = this.extractUserId(token);

    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new UnauthorizedException("Address not found or does not belong to you");
    }

    const updateData: any = {};

    // Only allow updating these fields
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.line1 !== undefined) updateData.line1 = data.line1;
    if (data.line2 !== undefined) updateData.line2 = data.line2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateData
    });
  }

  async deleteAddress(addressId: string, token: string) {
    const userId = this.extractUserId(token);

    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new UnauthorizedException("Address not found or does not belong to you");
    }

    return this.prisma.address.delete({ where: { id: addressId } });
  }

  async setDefaultAddress(addressId: string, token: string) {
    const userId = this.extractUserId(token);
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true }
    });
  }

  // ==================== COUPONS ====================
  async validateCoupon(code: string, cartProductIds?: string[]) {
    const normalized = String(code || "").trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    const influencer = await this.prisma.influencer.findUnique({
      where: { code: normalized },
      include: { products: true }
    }).catch(() => null);

    // Influencer coupon validation
    if (!coupon && influencer?.isActive) {
      // If cart products provided, check if any are eligible
      if (cartProductIds && cartProductIds.length > 0) {
        const eligibleProducts = influencer.products.map(p => p.id);
        const hasEligibleProducts = cartProductIds.some(pid => eligibleProducts.includes(pid));

        if (!hasEligibleProducts) {
          return {
            valid: false,
            message: `This code is only valid for specific products by ${influencer.name}. None of your cart items are eligible.`,
            type: "INFLUENCER"
          };
        }
      }

      return {
        valid: true,
        code: influencer.code,
        discountPercent: influencer.buyerDiscountPercent,
        discountAmount: null,
        minOrderAmount: null,
        type: "INFLUENCER",
        influencer: {
          name: influencer.name,
          socialHandle: influencer.socialHandle,
          imageUrl: influencer.imageUrl
        },
        eligibleProductIds: influencer.products.map(p => p.id)
      };
    }

    if (!coupon || !coupon.isActive) {
      return { valid: false, message: "Coupon is invalid or expired" };
    }

    // Check if coupon is within date range
    const now = new Date();
    if ((coupon.startsAt && now < coupon.startsAt) || (coupon.endsAt && now > coupon.endsAt)) {
      return { valid: false, message: "Coupon is not valid for the current date" };
    }

    return {
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount,
      minOrderAmount: coupon.minOrderAmount
    };
  }

  async listCoupons(limit: number = 10) {
    return this.prisma.coupon.findMany({
      where: { isActive: true },
      take: limit
    });
  }

  // ==================== ORDER TRACKING ====================
  async getUserOrders(token: string, status?: string) {
    const userId = this.extractUserId(token);
    const where: any = { userId };
    if (status) where.status = status;

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: { include: { product: { include: { images: true } } } }, payment: true },
      orderBy: { createdAt: "desc" }
    });

    return {
      data: orders.map((order: any) => this.toOrderDto(order))
    };
  }

  async trackOrder(orderId: string, token?: string) {
    const userId = token ? this.extractUserId(token) : undefined;
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
      include: {
        items: { include: { product: { include: { images: true } } } },
        payment: true,
        invoice: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        referrals: { include: { influencer: true } }
      }
    });

    if (!order) return { error: "Order not found" };
    return { data: this.toOrderDto(order) };
  }

  async getOrderInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } }
      }
    });

    if (!order) return { error: "Order not found" };

    // Generate invoice data
    const o = order as any;
    return {
      invoiceNumber: `INV-${o.id}`,
      orderDate: o.createdAt,
      shippingAddress: {
        name: o.shippingName,
        phone: o.shippingPhone,
        line1: o.shippingLine1,
        line2: o.shippingLine2,
        city: o.shippingCity,
        state: o.shippingState,
        postalCode: o.shippingPostalCode,
        country: o.shippingCountry
      },
      items: o.items,
      subtotal: o.subtotal,
      discount: o.discount,
      shippingFee: o.shippingFee,
      tax: o.tax,
      total: o.total
    };
  }

  // ==================== HELPER METHODS ====================
  private extractUserId(token: string): string {
    if (!token) {
      throw new UnauthorizedException("Login required");
    }

    try {
      const secret = this.config.get<string>("JWT_SECRET") || "dev-secret-key";
      const decoded = jwt.verify(token.replace("Bearer ", ""), secret) as any;
      if (!decoded.userId) throw new Error("Missing userId");
      return decoded.userId;
    } catch {
      throw new UnauthorizedException("Invalid login session");
    }
  }

  private toOrderDto(order: any): any {
    const o = order as any;
    const storesPaise = (o.items || []).some((item: any) => Number(item.price || 0) >= 10000);
    const money = (value: any) => {
      const amount = Number(value || 0);
      return storesPaise ? Math.round(amount / 100) : amount;
    };

    return {
      id: o.id,
      orderNumber: o.invoice?.invoiceNumber || o.id,
      status: o.status,
      subtotal: money(o.subtotal),
      discount: money(o.discount),
      tax: money(o.tax),
      shipping: money(o.shippingFee),
      shippingFee: money(o.shippingFee),
      total: money(o.total),
      paymentStatus: o.payment?.status || "PENDING",
      payment: o.payment ? {
        id: o.payment.id,
        provider: o.payment.provider,
        providerPaymentId: o.payment.providerPaymentId,
        status: o.payment.status,
        amount: money(o.payment.amount),
        paidAt: o.payment.paidAt,
        createdAt: o.payment.createdAt
      } : null,
      createdAt: o.createdAt,
      shippingAddress: {
        name: (o as any).shippingName,
        fullName: (o as any).shippingName,
        phone: (o as any).shippingPhone,
        street: (o as any).shippingLine1,
        line1: (o as any).shippingLine1,
        line2: (o as any).shippingLine2,
        city: (o as any).shippingCity,
        state: (o as any).shippingState,
        pincode: (o as any).shippingPostalCode,
        postalCode: (o as any).shippingPostalCode,
        country: (o as any).shippingCountry
      },
      statusHistory: o.statusHistory || [],
      influencer: o.referrals?.[0]?.influencer || null,
      items: (o.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        name: item.name,
        sku: item.sku,
        price: money(item.price),
        quantity: item.quantity,
        productSlug: item.product?.slug,
        productImage: item.product?.images?.[0]?.url || null,
        currentProduct: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Math.round(Number(item.product.price || 0) / 100),
          mrp: Math.round(Number(item.product.mrp || 0) / 100),
          images: item.product.images || []
        } : null
      }))
    };
  }
}
