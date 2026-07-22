import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class CommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, shippingAddress: true }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async createCheckout(body: any, token?: string) {
    const userId = this.extractUserId(token);
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException("Checkout needs at least one cart item");
    }

    const address = body.address;
    if (!address?.name || !address?.phone || !address?.street || !address?.city || !address?.state || !address?.pincode) {
      throw new BadRequestException("Complete delivery address is required");
    }

    const orderItems = await Promise.all(
      body.items.map(async (item: any) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true }
        });

        if (!product) {
          throw new BadRequestException(`Product not found: ${item.productId}`);
        }

        const variant = item.variantId
          ? product.variants.find((entry: any) => entry.id === item.variantId)
          : product.variants.find((entry: any) =>
              entry.size?.toLowerCase() === String(item.size || "").toLowerCase() &&
              entry.color?.toLowerCase() === String(item.color || "").toLowerCase()
            ) || product.variants[0];

        if (!variant) {
          throw new BadRequestException(`Variant not found for ${product.name}`);
        }

        return {
          product,
          variant,
          quantity: Math.max(Number(item.quantity || 1), 1),
          price: variant.price || product.price
        };
      })
    );

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const coupon = body.couponCode || body.offerCode ? await this.resolveCoupon(body.couponCode || body.offerCode, subtotal) : null;
    const discount = coupon?.discount || 0;
    const shippingFee = 0;
    const tax = Math.round((subtotal - discount) * 0.18);
    const total = Math.max(subtotal - discount + shippingFee + tax, 0);

    const order = await this.prisma.$transaction(async (tx: any) => {
      const shippingAddress = await tx.address.create({
        data: {
          userId,
          fullName: address.name,
          phone: address.phone,
          line1: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.pincode,
          country: "India"
        }
      });

      const created = await tx.order.create({
        data: {
          userId,
          shippingAddressId: shippingAddress.id,
          subtotal,
          discount,
          shippingFee,
          tax,
          total,
          items: {
            create: orderItems.map((item) => ({
              productId: item.product.id,
              variantId: item.variant.id,
              name: item.product.name,
              sku: item.variant.sku || item.product.sku,
              price: item.price,
              quantity: item.quantity
            }))
          },
          payment: {
            create: {
              provider: "RAZORPAY",
              status: "PENDING",
              amount: total,
              rawPayload: { checkoutSource: "web", couponCode: coupon?.code || null }
            }
          },
          statusHistory: {
            create: {
              toStatus: "PLACED",
              note: "Order created from web checkout.",
              changedBy: "system"
            }
          }
        },
        include: { payment: true, items: true, shippingAddress: true }
      });

      if (coupon?.influencer) {
        await tx.referral.create({
          data: {
            influencerId: coupon.influencer.id,
            orderId: created.id,
            code: `${coupon.influencer.code}-${created.id.slice(-6)}`,
            buyerDiscountPercent: coupon.influencer.buyerDiscountPercent,
            commissionAmount: Math.round(total * (coupon.influencer.commissionRate / 100)),
            linkKey: coupon.influencer.linkKey,
            convertedAt: new Date(),
            conversions: 1,
            totalEarnings: Math.round(total * (coupon.influencer.commissionRate / 100))
          }
        });

        await tx.influencer.update({
          where: { id: coupon.influencer.id },
          data: {
            totalReferrals: { increment: 1 },
            totalEarnings: { increment: Math.round(total * (coupon.influencer.commissionRate / 100)) }
          }
        });
      }

      return created;
    });

    return {
      success: true,
      data: {
        ...order,
        razorpayOrderId: `order_${order.id}`,
        amount: total,
        currency: "INR"
      }
    };
  }

  async verifyCheckout(body: any, token?: string) {
    this.extractUserId(token);
    if (!body.orderId) {
      throw new BadRequestException("orderId is required");
    }

    const order = await this.prisma.order.update({
      where: { id: body.orderId },
      data: {
        status: "CONFIRMED",
        payment: {
          update: {
            status: "PAID",
            providerPaymentId: body.razorpayPaymentId || body.paymentId || null,
            paidAt: new Date(),
            rawPayload: body
          }
        },
        statusHistory: {
          create: {
            fromStatus: "PLACED",
            toStatus: "CONFIRMED",
            note: "Payment verified.",
            changedBy: "system"
          }
        }
      },
      include: { payment: true, items: true, shippingAddress: true }
    });

    return { success: true, data: order };
  }

  private async resolveCoupon(code: string, subtotal: number) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return null;

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    const influencer = await this.prisma.influencer.findUnique({ where: { code: normalized } }).catch(() => null);
    const now = new Date();

    if (coupon?.isActive) {
      if ((coupon.startsAt && now < coupon.startsAt) || (coupon.endsAt && now > coupon.endsAt)) return null;
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return null;

      const percentDiscount = coupon.discountPercent ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0;
      return {
        code: coupon.code,
        discount: coupon.discountAmount || percentDiscount,
        influencer: null
      };
    }

    if (influencer?.isActive) {
      return {
        code: influencer.code,
        discount: Math.round(subtotal * (influencer.buyerDiscountPercent / 100)),
        influencer
      };
    }

    return null;
  }

  private extractUserId(token?: string): string {
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
}
