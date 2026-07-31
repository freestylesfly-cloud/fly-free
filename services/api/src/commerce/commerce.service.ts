import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";

@Injectable()
export class CommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true }
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
          price: this.catalogPriceToRupees(variant.price || product.price)
        };
      })
    );

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const coupon = body.couponCode || body.offerCode ? await this.resolveCoupon(body.couponCode || body.offerCode, subtotal) : null;
    const discount = coupon?.discount || 0;

    // Delivery is the only charge on top of items; there is no tax line.
    const payable = Math.max(subtotal - discount, 0);
    const { deliveryFee, freeDeliveryAbove } = await this.getDeliverySettings();
    const shippingFee = payable >= freeDeliveryAbove ? 0 : deliveryFee;
    const tax = 0;
    const total = payable + shippingFee;

    const order = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          orderNumber: await this.generateOrderNumber(tx),
          user: { connect: { id: userId } },
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingLine1: address.street,
          shippingLine2: address.line2 || null,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.pincode,
          shippingCountry: address.country || "India",
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
        include: { payment: true, items: true }
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

    const razorpayOrder = await this.createRazorpayOrder(order.id, total);

    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        rawPayload: {
          checkoutSource: "web",
          couponCode: coupon?.code || null,
          razorpayOrderId: razorpayOrder.id
        }
      }
    });

    return {
      success: true,
      data: {
        ...order,
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        currency: "INR"
      }
    };
  }

  async verifyCheckout(body: any, token?: string) {
    const userId = this.extractUserId(token);
    if (!body.orderId) {
      throw new BadRequestException("orderId is required");
    }

    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      throw new BadRequestException("Complete Razorpay payment details are required");
    }

    const orderToVerify = await this.prisma.order.findFirst({
      where: { id: body.orderId, userId },
      include: { payment: true }
    });

    if (!orderToVerify) {
      throw new NotFoundException("Order not found");
    }

    const rawPayload = orderToVerify.payment?.rawPayload as { razorpayOrderId?: string } | null;
    if (!rawPayload?.razorpayOrderId || rawPayload.razorpayOrderId !== body.razorpayOrderId) {
      throw new BadRequestException("Razorpay order does not match this checkout");
    }

    if (!this.isValidRazorpaySignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature)) {
      await this.prisma.payment.update({
        where: { orderId: body.orderId },
        data: {
          status: "FAILED",
          rawPayload: {
            ...rawPayload,
            verificationAttempt: body,
            verificationError: "Invalid Razorpay signature"
          }
        }
      });
      throw new BadRequestException("Payment verification failed");
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
            rawPayload: {
              ...rawPayload,
              verification: body
            }
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
      include: { payment: true, items: true }
    });

    return { success: true, data: order };
  }

  async retryPayment(body: any, token?: string) {
    const userId = this.extractUserId(token);
    if (!body.orderId) {
      throw new BadRequestException("orderId is required");
    }

    const order = await this.prisma.order.findFirst({
      where: { id: body.orderId, userId },
      include: { payment: true }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.payment?.status === "PAID") {
      throw new BadRequestException("This order is already paid");
    }

    const rawPayload = (order.payment?.rawPayload || {}) as Record<string, unknown>;
    const razorpayOrder = await this.createRazorpayOrder(order.id, order.total);

    await this.prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: "PENDING",
        rawPayload: {
          ...rawPayload,
          retryRazorpayOrderId: razorpayOrder.id,
          razorpayOrderId: razorpayOrder.id
        }
      }
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: "INR"
      }
    };
  }

  /**
   * Human-facing order reference: <PREFIX>-<YEAR>-<6 digit serial>, e.g. FF-2026-000123.
   * The serial restarts each calendar year. Callers retry on the unique
   * constraint, so a race between two checkouts resolves on the next attempt.
   */
  private async generateOrderNumber(tx: any) {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const value = setting?.value as any;
    const prefix = String(value?.orderPrefix || "FF").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const year = new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const countThisYear = await tx.order.count({ where: { createdAt: { gte: startOfYear } } });

    return `${prefix}-${year}-${String(countThisYear + 1).padStart(6, "0")}`;
  }

  /** Delivery pricing comes from admin settings so it can change without a deploy. */
  private async getDeliverySettings() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const value = setting?.value as any;
    return {
      deliveryFee: Number(value?.deliveryFee ?? 60),
      freeDeliveryAbove: Number(value?.freeDeliveryAbove ?? 1000)
    };
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

  private async createRazorpayOrder(orderId: string, amount: number) {
    const { keyId, keySecret } = this.getRazorpayCredentials();

    if (!keyId || !keySecret) {
      throw new BadRequestException("Razorpay is not configured on the API server");
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `ff_${orderId}`,
        notes: {
          orderId
        }
      })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.id) {
      throw new BadRequestException(payload?.error?.description || "Failed to create Razorpay order");
    }

    return payload;
  }

  private isValidRazorpaySignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const { keySecret } = this.getRazorpayCredentials();
    if (!keySecret) {
      throw new BadRequestException("Razorpay is not configured on the API server");
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature.length !== razorpaySignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));
  }

  private getRazorpayCredentials() {
    const configured = {
      keyId: this.cleanConfigValue(this.config.get<string>("RAZORPAY_KEY_ID")),
      keySecret: this.cleanConfigValue(this.config.get<string>("RAZORPAY_KEY_SECRET"))
    };

    if (this.isUsableRazorpayCredential(configured.keyId) && this.isUsableRazorpayCredential(configured.keySecret)) {
      return configured;
    }

    return {
      keyId: this.readLocalEnvValue("RAZORPAY_KEY_ID") || configured.keyId,
      keySecret: this.readLocalEnvValue("RAZORPAY_KEY_SECRET") || configured.keySecret
    };
  }

  private readLocalEnvValue(name: string) {
    const envPaths = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), "services/api/.env.local")
    ];

    for (const envPath of envPaths) {
      if (!fs.existsSync(envPath)) continue;

      const line = fs
        .readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .find((entry) => entry.trim().startsWith(`${name}=`));

      const value = this.cleanConfigValue(line?.split("=").slice(1).join("="));
      if (this.isUsableRazorpayCredential(value)) return value;
    }

    return undefined;
  }

  private cleanConfigValue(value?: string) {
    return value?.trim().replace(/^["']|["']$/g, "");
  }

  private isUsableRazorpayCredential(value?: string) {
    return Boolean(value && value !== "..." && !value.includes("..."));
  }

  private catalogPriceToRupees(price: number) {
    return Math.round(Number(price || 0) / 100);
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
