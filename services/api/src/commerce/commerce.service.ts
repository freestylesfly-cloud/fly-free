import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import * as crypto from "crypto";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import { requireJwtSecret } from "../auth/jwt-secret";
import * as path from "path";

/**
 * How long a quote stays payable. Long enough to finish a card or UPI flow,
 * short enough that a stale price cannot be replayed later.
 */
const QUOTE_TTL_MINUTES = 30;

/** A cart priced by the server. Never persisted — recomputed on each call. */
type CheckoutQuote = {
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  coupon: {
    code: string;
    influencerId: string | null;
    buyerDiscountPercent: number;
    commissionRate: number;
    linkKey: string | null;
  } | null;
};

/** A quote bound to one customer and one Razorpay order, with an expiry. */
type SignedQuote = CheckoutQuote & {
  userId: string;
  razorpayOrderId: string;
  expiresAt: number;
};

@Injectable()
export class CommerceService {
  private readonly logger = new Logger(CommerceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService
  ) {}

  async getOrder(id: string, token?: string) {
    const userId = this.extractUserId(token);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true }
    });

    // Someone else's order is reported as missing rather than forbidden, so ids
    // cannot be probed for existence.
    if (!order || order.userId !== userId) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  /**
   * Starts a payment. Deliberately writes nothing to the database: if the
   * customer abandons the Razorpay modal or the card is declined, there is no
   * row anywhere to clean up — they simply check out again.
   *
   * The priced quote is handed back to the browser as a signed token instead of
   * being stored. It is HMAC'd with the server secret, so it cannot be edited,
   * and it pins the price: whatever an admin changes while the modal is open,
   * the customer is billed exactly what they were quoted.
   */
  async createCheckout(body: any, token?: string) {
    const userId = this.extractUserId(token);
    const quote = await this.priceCheckout(body, userId);

    await this.assertStockAvailable(quote);

    const razorpayOrder = await this.createRazorpayOrder(userId, quote.total);

    return {
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        quoteToken: this.signQuote({
          ...quote,
          userId,
          razorpayOrderId: razorpayOrder.id,
          expiresAt: Date.now() + QUOTE_TTL_MINUTES * 60_000
        }),
        // Served from the API so the browser can never use a mismatched key.
        razorpayKeyId: this.getRazorpayCredentials().keyId,
        amount: quote.total,
        currency: "INR"
      }
    };
  }

  /** Seals a quote so the browser can hold it without being able to alter it. */
  private signQuote(quote: SignedQuote) {
    const body = Buffer.from(JSON.stringify(quote)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", requireJwtSecret(this.config))
      .update(body)
      .digest("base64url");

    return `${body}.${signature}`;
  }

  /** Opens a quote, rejecting anything edited, expired or from another session. */
  private readQuote(quoteToken: string, userId: string, razorpayOrderId: string): SignedQuote {
    const [body, signature] = String(quoteToken || "").split(".");
    if (!body || !signature) {
      throw new BadRequestException("This checkout could not be confirmed. Please try again from your cart.");
    }

    const expected = crypto
      .createHmac("sha256", requireJwtSecret(this.config))
      .update(body)
      .digest("base64url");

    if (
      expected.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      throw new BadRequestException("This checkout could not be confirmed. Please try again from your cart.");
    }

    const quote = JSON.parse(Buffer.from(body, "base64url").toString()) as SignedQuote;

    // Bound to one buyer and one payment, so a valid quote cannot be reused by
    // someone else or against a cheaper Razorpay order.
    if (quote.userId !== userId || quote.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestException("This checkout could not be confirmed. Please try again from your cart.");
    }

    if (Date.now() > quote.expiresAt) {
      throw new BadRequestException("This checkout expired before payment completed. Please try again from your cart.");
    }

    return quote;
  }

  /**
   * Checked before the customer is asked for money, so the common out-of-stock
   * case is a plain message rather than a refund.
   */
  private async assertStockAvailable(quote: CheckoutQuote) {
    const levels = await this.prisma.inventory.findMany({
      where: { variantId: { in: quote.items.map((item) => item.variantId) } },
      select: { variantId: true, stock: true }
    });

    const stockByVariant = new Map(levels.map((level) => [level.variantId, level.stock]));

    for (const item of quote.items) {
      // A variant with no inventory row has never been stocked; treat it as
      // unlimited rather than blocking a sale on missing data.
      const stock = stockByVariant.get(item.variantId);
      if (stock === undefined) continue;

      if (stock < item.quantity) {
        throw new BadRequestException(
          stock === 0
            ? `"${item.name}" just sold out. Remove it from your cart to continue.`
            : `Only ${stock} left of "${item.name}". Reduce the quantity to continue.`
        );
      }
    }
  }

  /**
   * Prices a cart from the database. Called when payment starts and again when
   * it is verified, so the customer is charged and billed off the same numbers
   * and nothing the browser sends can set a price.
   */
  private async priceCheckout(body: any, userId: string) {
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

        // A cart can outlive the listing. Refuse the order rather than sell
        // something an admin has pulled from the store.
        if (!product.isVisible) {
          throw new BadRequestException(`"${product.name}" is no longer available. Remove it from your cart to continue.`);
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
    const coupon = body.couponCode || body.offerCode ? await this.resolveCoupon(body.couponCode || body.offerCode, subtotal, userId) : null;
    const discountBase = coupon?.influencer?.products?.length
      ? orderItems
          .filter((item) => coupon.influencer.products.some((product: any) => product.id === item.product.id))
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      : subtotal;
    const discount = coupon?.influencer
      ? Math.round(discountBase * (coupon.influencer.buyerDiscountPercent / 100))
      : coupon?.discount || 0;

    // Delivery is the only charge on top of items; there is no tax line.
    const payable = Math.max(subtotal - discount, 0);
    const { deliveryFee, freeDeliveryAbove } = await this.getDeliverySettings();
    const shippingFee = payable >= freeDeliveryAbove ? 0 : deliveryFee;
    const tax = 0;
    const total = payable + shippingFee;

    const quote: CheckoutQuote = {
      address: {
        name: address.name,
        phone: address.phone,
        line1: address.street,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.pincode,
        country: address.country || "India"
      },
      items: orderItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        name: item.product.name,
        sku: item.variant.sku || item.product.sku,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      discount,
      shippingFee,
      tax,
      total,
      coupon: coupon
        ? {
            code: coupon.code,
            influencerId: coupon.influencer?.id ?? null,
            buyerDiscountPercent: coupon.influencer?.buyerDiscountPercent ?? 0,
            commissionRate: coupon.influencer?.commissionRate ?? 0,
            linkKey: coupon.influencer?.linkKey ?? null
          }
        : null
    };

    return quote;
  }

  /**
   * The only place an Order is created. Runs after Razorpay has confirmed the
   * payment, so every row in the Orders table is a paid order.
   */
  async verifyCheckout(body: any, token?: string) {
    const userId = this.extractUserId(token);

    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      throw new BadRequestException("Complete Razorpay payment details are required");
    }

    // Razorpay retries its callback and customers double-click, so a payment
    // that already produced an order returns that order instead of a second one.
    const existing = await this.findOrderByPaymentId(body.razorpayPaymentId, userId);
    if (existing) return { success: true, data: existing };

    if (!this.isValidRazorpaySignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature)) {
      // Nothing was written when payment started, so there is nothing to undo.
      throw new BadRequestException("Payment verification failed");
    }

    // The price the customer agreed to, sealed when payment started. Not
    // recomputed here: a price edit or an expiring coupon in the intervening
    // minutes must not change what an already-paying customer is billed.
    const quote = this.readQuote(body.quoteToken, userId, body.razorpayOrderId);

    // A valid signature only proves the payment belongs to this Razorpay order.
    // This proves the money actually arrived, and that it is the quoted amount.
    await this.assertRazorpayOrderPaid(body.razorpayOrderId, quote.total);

    const commission = quote.coupon?.influencerId
      ? Math.round(quote.total * (quote.coupon.commissionRate / 100))
      : 0;

    const order = await this.withOrderNumberRetry((orderNumber) =>
      this.prisma.$transaction(
        async (tx: any) => {
          const created = await tx.order.create({
            data: {
              orderNumber,
              user: { connect: { id: userId } },
              shippingName: quote.address.name,
              shippingPhone: quote.address.phone,
              shippingLine1: quote.address.line1,
              shippingLine2: quote.address.line2,
              shippingCity: quote.address.city,
              shippingState: quote.address.state,
              shippingPostalCode: quote.address.postalCode,
              shippingCountry: quote.address.country,
              status: "CONFIRMED",
              subtotal: quote.subtotal,
              discount: quote.discount,
              shippingFee: quote.shippingFee,
              tax: quote.tax,
              total: quote.total,
              items: { create: quote.items },
              payment: {
                create: {
                  provider: "RAZORPAY",
                  status: "PAID",
                  amount: quote.total,
                  providerPaymentId: body.razorpayPaymentId,
                  paidAt: new Date(),
                  rawPayload: {
                    checkoutSource: "web",
                    couponCode: quote.coupon?.code || null,
                    razorpayOrderId: body.razorpayOrderId
                  }
                }
              },
              statusHistory: {
                create: {
                  toStatus: "CONFIRMED",
                  note: "Payment verified.",
                  changedBy: "system"
                }
              }
            },
            include: { payment: true, items: true }
          });

          const shortfalls = await this.commitStock(tx, quote);

          // The customer has paid, so a race for the last unit still produces an
          // order — it is flagged for the admin instead of being refused.
          if (shortfalls.length) {
            await tx.orderStatusHistory.create({
              data: {
                orderId: created.id,
                toStatus: "CONFIRMED",
                note: `Oversold, needs restock or refund: ${shortfalls.join("; ")}`,
                changedBy: "system"
              }
            });
          }

          // Commission is only earned on money actually taken, which is why this
          // moved here from checkout.
          if (quote.coupon?.influencerId) {
            await tx.referral.create({
              data: {
                influencerId: quote.coupon.influencerId,
                orderId: created.id,
                code: `${quote.coupon.code}-${created.id.slice(-6)}`,
                buyerDiscountPercent: quote.coupon.buyerDiscountPercent,
                commissionAmount: commission,
                linkKey: quote.coupon.linkKey,
                convertedAt: new Date(),
                conversions: 1,
                totalEarnings: commission
              }
            });

            await tx.influencer.update({
              where: { id: quote.coupon.influencerId },
              data: {
                totalReferrals: { increment: 1 },
                totalEarnings: { increment: commission }
              }
            });
          }

          return created;
        },
        {
          // Must not fail on the default 5s interactive deadline when the
          // database is in another region and the cart has many lines.
          timeout: 30_000,
          maxWait: 10_000
        }
      )
    );

    // Two verifications landing together: one inserted the order, the other lost
    // the unique payment id. Hand back the winner rather than an error.
    if (!order) {
      const winner = await this.findOrderByPaymentId(body.razorpayPaymentId, userId);
      if (winner) return { success: true, data: winner };
      throw new BadRequestException("We could not confirm this payment. Please contact support.");
    }

    await this.sendOrderConfirmation(order, userId, quote);

    return { success: true, data: order };
  }

  /**
   * Confirmation email for a paid order.
   *
   * Deliberately never throws: the money is taken and the order exists, so a
   * mail outage must not turn a successful checkout into an error the customer
   * might act on by paying again.
   */
  private async sendOrderConfirmation(order: any, userId: string, quote: CheckoutQuote) {
    try {
      const customer = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (!customer?.email) return;

      await this.email.sendOrderConfirmation(customer.email, {
        ...order,
        customerName: customer.name,
        shippingAddress: {
          line1: quote.address.line1,
          city: quote.address.city,
          state: quote.address.state,
          postalCode: quote.address.postalCode
        }
      });
    } catch (error) {
      this.logger.error(`Order ${order.orderNumber ?? order.id} confirmed but its email failed: ${error}`);
    }
  }

  /**
   * Takes the stock for a paid order, one guarded update per line.
   *
   * `updateMany` with a `stock >= quantity` filter is the whole race protection:
   * Postgres locks the row for the update, so two checkouts for the last unit
   * cannot both succeed. Returns the lines that could not be filled.
   */
  private async commitStock(tx: any, quote: CheckoutQuote) {
    const shortfalls: string[] = [];

    for (const item of quote.items) {
      const taken = await tx.inventory.updateMany({
        where: { variantId: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } }
      });

      if (taken.count === 1) continue;

      // Either the variant has no inventory row (never stocked, unlimited) or
      // someone else took the last one between quoting and paying.
      const level = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
        select: { stock: true }
      });

      if (!level) continue;

      shortfalls.push(`${item.name} (${item.sku}) x${item.quantity}, ${level.stock} in stock`);
    }

    return shortfalls;
  }

  /**
   * Order numbers are a per-year serial, so two checkouts completing together
   * derive the same one and the loser hits the unique index. Retries with a
   * freshly counted number instead of failing a payment that already went
   * through. Returns null when the order was rejected as a duplicate payment.
   */
  private async withOrderNumberRetry<T>(create: (orderNumber: string) => Promise<T>): Promise<T | null> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await create(await this.generateOrderNumber());
      } catch (error: any) {
        const target = String(error?.meta?.target ?? "");

        if (error?.code === "P2002" && target.includes("providerPaymentId")) {
          return null;
        }

        if (error?.code === "P2002" && target.includes("orderNumber")) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException("We could not confirm this payment. Please contact support.");
  }

  /**
   * Confirms with Razorpay that this order was paid, and for the amount we are
   * about to bill. Without it a second call could submit a fatter cart than the
   * one that was actually paid for.
   */
  private async assertRazorpayOrderPaid(razorpayOrderId: string, expectedRupees: number) {
    const { keyId, keySecret } = this.getRazorpayCredentials();

    const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` }
    });

    const payload: any = await response.json().catch(() => null);
    if (!response.ok || !payload?.id) {
      throw new BadRequestException("Could not confirm this payment with Razorpay");
    }

    if (payload.status !== "paid" || Number(payload.amount_paid) !== Number(payload.amount)) {
      throw new BadRequestException("This payment has not been completed");
    }

    if (Number(payload.amount) !== Math.round(expectedRupees * 100)) {
      throw new BadRequestException("The amount paid does not match this order. Please contact support.");
    }
  }

  /** Finds the order a gateway payment already produced, for replayed callbacks. */
  private async findOrderByPaymentId(razorpayPaymentId: string, userId: string) {
    return this.prisma.order.findFirst({
      where: {
        userId,
        payment: { providerPaymentId: razorpayPaymentId }
      },
      include: { payment: true, items: true }
    });
  }

  /**
   * Human-facing order reference: <PREFIX>-<YEAR>-<6 digit serial>, e.g. FF-2026-000123.
   * The serial restarts each calendar year.
   *
   * Counting rows is inherently racy — two checkouts finishing together both
   * read the same count. `withOrderNumberRetry` is what makes that safe; it
   * recounts and tries again when the unique index rejects the loser.
   */
  private async generateOrderNumber() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
    const value = setting?.value as any;
    const prefix = String(value?.orderPrefix || "FF").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const year = new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const countThisYear = await this.prisma.order.count({ where: { createdAt: { gte: startOfYear } } });

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

  private async resolveCoupon(code: string, subtotal: number, userId: string) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return null;

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    const influencer = await this.prisma.influencer.findUnique({ where: { code: normalized }, include: { products: true } }).catch(() => null);
    const now = new Date();

    if (coupon?.isActive) {
      if ((coupon.startsAt && now < coupon.startsAt) || (coupon.endsAt && now > coupon.endsAt)) return null;
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return null;
      if (await this.isBlockedFirstOrderOffer(normalized, userId)) return null;

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

  private async isBlockedFirstOrderOffer(code: string, userId: string) {
    const offer = await this.prisma.coupon.findFirst({
      where: { code, isFirstOrder: true, isActive: true },
      select: { id: true }
    });
    if (!offer) return false;

    const previousOrders = await this.prisma.order.count({ where: { userId } });
    return previousOrders > 0;
  }

  /** `reference` is only a receipt label — there is no order yet at this point. */
  private async createRazorpayOrder(reference: string, amount: number) {
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
        receipt: `ff_${reference}_${Date.now()}`.slice(0, 40),
        notes: {
          userId: reference
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
      const secret = requireJwtSecret(this.config);
      const decoded = jwt.verify(token.replace("Bearer ", ""), secret) as any;
      if (!decoded.userId) throw new Error("Missing userId");
      return decoded.userId;
    } catch {
      throw new UnauthorizedException("Invalid login session");
    }
  }
}
