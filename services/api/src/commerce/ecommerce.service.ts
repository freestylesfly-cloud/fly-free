import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EcommerceService {
  constructor(private prisma: PrismaService) {}

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
    const coupon = await this.prisma.coupon.findUnique({
      where: { code }
    });

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

    return this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, shippingAddress: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async trackOrder(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        payment: true
      }
    });
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
    // Extract user ID from Bearer token
    // Format: "Bearer jwt_token_userId"
    const parts = token.replace("Bearer ", "").split("_");
    return parts[parts.length - 1];
  }
}
