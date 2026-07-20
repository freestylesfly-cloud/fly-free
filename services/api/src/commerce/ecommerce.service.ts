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

  async updateAddress(addressId: string, data: any) {
    return this.prisma.address.update({
      where: { id: addressId },
      data
    });
  }

  async deleteAddress(addressId: string) {
    return this.prisma.address.delete({ where: { id: addressId } });
  }

  // ==================== COUPONS ====================
  async validateCoupon(code: string) {
    const normalized = String(code || "").trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    const influencer = await this.prisma.influencer.findUnique({ where: { code: normalized } }).catch(() => null);

    if (!coupon && influencer?.isActive) {
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
        }
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
      include: { items: { include: { product: { include: { images: true } } } }, shippingAddress: true, payment: true },
      orderBy: { createdAt: "desc" }
    });

    return {
      data: orders.map((order) => this.toOrderDto(order))
    };
  }

  async trackOrder(orderId: string, token?: string) {
    const userId = token ? this.extractUserId(token) : undefined;
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
      include: {
        items: { include: { product: { include: { images: true } } } },
        shippingAddress: true,
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
        items: { include: { product: true } },
        user: true,
        shippingAddress: true
      }
    });

    if (!order) return { error: "Order not found" };

    // Generate invoice data
    return {
      invoiceNumber: `INV-${order.id}`,
      orderDate: order.createdAt,
      customer: order.user,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total
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

  private toOrderDto(order: any) {
    return {
      id: order.id,
      orderNumber: order.invoice?.invoiceNumber || order.id,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      shipping: order.shippingFee,
      shippingFee: order.shippingFee,
      total: order.total,
      paymentStatus: order.payment?.status || "PENDING",
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress ? {
        name: order.shippingAddress.fullName,
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        street: order.shippingAddress.line1,
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.postalCode,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      statusHistory: order.statusHistory || [],
      influencer: order.referrals?.[0]?.influencer || null,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        productSlug: item.product?.slug,
        productImage: item.product?.images?.[0]?.url || null,
        currentProduct: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          mrp: item.product.mrp,
          images: item.product.images || []
        } : null
      }))
    };
  }
}
