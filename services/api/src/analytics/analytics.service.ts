import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as jwt from "jsonwebtoken";
import { requireJwtSecret } from "../auth/jwt-secret";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "payment_opened",
  "payment_success"
]);

type CountRow<T extends string> = Record<T, string | null> & { _count: { id: number } };
type AnalyticsEventRow = {
  name: string;
  sessionId?: string | null;
  userId?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  state?: string | null;
  pincodePrefix?: string | null;
  device?: string | null;
  referrer?: string | null;
  createdAt: Date;
};
type AnalyticsOrderRow = {
  userId: string;
  total: number;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  createdAt: Date;
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    product?: { name: string; slug: string } | null;
  }>;
};
type AnalyticsDb = PrismaService & {
  analyticsEvent: {
    create(args: any): Promise<unknown>;
    count(args: any): Promise<number>;
    groupBy(args: any): Promise<Array<CountRow<string>>>;
    findMany(args: any): Promise<AnalyticsEventRow[]>;
  };
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(body: any, request: any) {
    const name = String(body?.name || "").trim();
    if (!ALLOWED_EVENTS.has(name)) {
      throw new BadRequestException("Unsupported analytics event");
    }

    const userId = this.tryExtractUserId(request.headers?.authorization);
    const metadata = this.cleanMetadata(body?.metadata);
    const userAgent = String(request.headers?.["user-agent"] || "").slice(0, 500);

    await this.db.analyticsEvent.create({
      data: {
        name,
        sessionId: this.cleanText(body?.sessionId, 80),
        userId,
        productId: this.cleanText(body?.productId, 80),
        productSlug: this.cleanText(body?.productSlug, 160),
        orderId: this.cleanText(body?.orderId, 80),
        state: this.cleanText(body?.state, 80),
        pincodePrefix: this.cleanPincodePrefix(body?.pincodePrefix),
        device: this.cleanDevice(body?.device, userAgent),
        referrer: this.cleanText(body?.referrer, 300),
        path: this.cleanText(body?.path, 300),
        metadata,
        ip: this.clientIp(request),
        userAgent
      }
    });

    return { ok: true };
  }

  async summary(days = 30) {
    const safeDays = Math.min(Math.max(Number(days) || 30, 1), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);

    const where = { createdAt: { gte: startDate } };
    const [total, byEvent, byDevice, byState, byPincode, topProducts, topReferrers, recent, events, orders] = await Promise.all([
      this.db.analyticsEvent.count({ where }),
      this.db.analyticsEvent.groupBy({
        by: ["name"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } }
      }) as Promise<Array<CountRow<"name">>>,
      this.db.analyticsEvent.groupBy({
        by: ["device"],
        where: { ...where, device: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } }
      }) as Promise<Array<CountRow<"device">>>,
      this.db.analyticsEvent.groupBy({
        by: ["state"],
        where: { ...where, state: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 12
      }) as Promise<Array<CountRow<"state">>>,
      this.db.analyticsEvent.groupBy({
        by: ["pincodePrefix"],
        where: { ...where, pincodePrefix: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 12
      }) as Promise<Array<CountRow<"pincodePrefix">>>,
      this.db.analyticsEvent.groupBy({
        by: ["productId", "productSlug"],
        where: { ...where, productId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      }) as Promise<Array<CountRow<"productId" | "productSlug">>>,
      this.db.analyticsEvent.groupBy({
        by: ["referrer"],
        where: { ...where, referrer: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      }) as Promise<Array<CountRow<"referrer">>>,
      this.db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      this.db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] }
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true, slug: true } } } },
          payment: true
        },
        orderBy: { createdAt: "desc" },
        take: 1000
      }) as Promise<AnalyticsOrderRow[]>
    ]);

    const eventCounts = Object.fromEntries(byEvent.map((item) => [item.name, item._count.id]));
    const productIds = topProducts.map((item) => item.productId).filter(Boolean) as string[];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true }
        })
      : [];
    const productById = new Map(products.map((product) => [product.id, product]));

    const funnel = [
      { label: "Product views", event: "product_view", value: eventCounts.product_view || 0 },
      { label: "Add to cart", event: "add_to_cart", value: eventCounts.add_to_cart || 0 },
      { label: "Checkout started", event: "checkout_started", value: eventCounts.checkout_started || 0 },
      { label: "Payment opened", event: "payment_opened", value: eventCounts.payment_opened || 0 },
      { label: "Payment success", event: "payment_success", value: eventCounts.payment_success || 0 }
    ];
    const paidRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
    const addToCartRate = this.percent(eventCounts.add_to_cart || 0, eventCounts.product_view || 0);
    const checkoutRate = this.percent(eventCounts.checkout_started || 0, eventCounts.add_to_cart || 0);
    const paymentRate = this.percent(eventCounts.payment_success || 0, eventCounts.checkout_started || 0);
    const averageOrderValue = orders.length ? Math.round(paidRevenue / orders.length) : 0;
    const productPerformance = this.productPerformance(events, orders);
    const regionPerformance = this.regionPerformance(events, orders);
    const referrerPerformance = this.dimensionPerformance(events, "referrer");
    const devicePerformance = this.dimensionPerformance(events, "device");
    const customerActivity = this.customerActivity(events, orders);

    return {
      periodDays: safeDays,
      total,
      sales: {
        revenue: paidRevenue,
        orders: orders.length,
        averageOrderValue,
        addToCartRate,
        checkoutRate,
        paymentRate
      },
      eventCounts,
      funnel,
      byEvent: byEvent.map(this.countRow),
      byDevice: byDevice.map((item) => ({ label: item.device || "Unknown", value: item._count.id })),
      byState: byState.map((item) => ({ label: item.state || "Unknown", value: item._count.id })),
      byPincode: byPincode.map((item) => ({ label: item.pincodePrefix || "Unknown", value: item._count.id })),
      topProducts: topProducts.map((item) => {
        const product = item.productId ? productById.get(item.productId) : null;
        return {
          productId: item.productId,
          productSlug: product?.slug || item.productSlug,
          name: product?.name || item.productSlug || item.productId || "Unknown product",
          value: item._count.id
        };
      }),
      topReferrers: topReferrers.map((item) => ({ label: item.referrer || "Direct", value: item._count.id })),
      productPerformance,
      regionPerformance,
      referrerPerformance,
      devicePerformance,
      customerActivity,
      recent
    };
  }

  private get db() {
    return this.prisma as AnalyticsDb;
  }

  private countRow(item: { name: string | null; _count: { id: number } }) {
    return { label: item.name || "Unknown", value: item._count.id };
  }

  private cleanText(value: unknown, max: number) {
    const text = String(value || "").trim();
    return text ? text.slice(0, max) : undefined;
  }

  private cleanPincodePrefix(value: unknown) {
    const prefix = String(value || "").replace(/\D/g, "").slice(0, 3);
    return prefix || undefined;
  }

  private cleanDevice(value: unknown, userAgent: string) {
    const provided = String(value || "").toLowerCase();
    if (["mobile", "desktop", "tablet"].includes(provided)) return provided;
    if (/ipad|tablet/i.test(userAgent)) return "tablet";
    if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
    return "desktop";
  }

  private cleanMetadata(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(
      entries.map(([key, entry]) => [key.slice(0, 60), typeof entry === "object" ? JSON.stringify(entry).slice(0, 300) : String(entry).slice(0, 300)])
    );
  }

  private tryExtractUserId(authHeader?: string) {
    if (!authHeader) return undefined;
    try {
      const decoded = jwt.verify(authHeader.replace(/^Bearer\s+/i, ""), requireJwtSecret()) as any;
      return decoded?.userId ? String(decoded.userId) : undefined;
    } catch {
      return undefined;
    }
  }

  private clientIp(request: any) {
    const forwarded = String(request.headers?.["x-forwarded-for"] || "");
    return (forwarded.split(",")[0].trim() || request.ip || request.socket?.remoteAddress || "").slice(0, 80);
  }

  private percent(numerator: number, denominator: number) {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
  }

  private productPerformance(events: any[], orders: any[]) {
    const rows = new Map<string, any>();
    const ensure = (id: string, fallback?: string) => {
      const key = id || fallback || "unknown";
      if (!rows.has(key)) {
        rows.set(key, {
          productId: id || null,
          productSlug: fallback || null,
          name: fallback || "Unknown product",
          views: 0,
          adds: 0,
          orders: 0,
          quantity: 0,
          revenue: 0
        });
      }
      return rows.get(key);
    };

    for (const event of events) {
      if (!event.productId && !event.productSlug) continue;
      const row = ensure(event.productId, event.productSlug);
      if (event.name === "product_view") row.views += 1;
      if (event.name === "add_to_cart") row.adds += 1;
    }

    for (const order of orders) {
      for (const item of order.items || []) {
        const row = ensure(item.productId, item.product?.slug);
        row.name = item.product?.name || item.name || row.name;
        row.productSlug = item.product?.slug || row.productSlug;
        row.orders += 1;
        row.quantity += Number(item.quantity || 0);
        row.revenue += Number(item.price || 0) * Number(item.quantity || 0);
      }
    }

    return [...rows.values()]
      .map((row) => ({
        ...row,
        cartRate: this.percent(row.adds, row.views),
        buyRate: this.percent(row.orders, row.views)
      }))
      .sort((a, b) => b.revenue - a.revenue || b.adds - a.adds || b.views - a.views)
      .slice(0, 20);
  }

  private regionPerformance(events: any[], orders: any[]) {
    const rows = new Map<string, any>();
    const ensure = (state?: string | null, pincodePrefix?: string | null) => {
      const label = state || (pincodePrefix ? `PIN ${pincodePrefix}` : "Unknown");
      if (!rows.has(label)) {
        rows.set(label, { label, state: state || null, pincodePrefix: pincodePrefix || null, events: 0, checkouts: 0, orders: 0, revenue: 0 });
      }
      return rows.get(label);
    };

    for (const event of events) {
      if (!event.state && !event.pincodePrefix) continue;
      const row = ensure(event.state, event.pincodePrefix);
      row.events += 1;
      if (event.name === "checkout_started") row.checkouts += 1;
    }

    for (const order of orders) {
      const prefix = String(order.shippingPostalCode || "").replace(/\D/g, "").slice(0, 3) || null;
      const row = ensure(order.shippingState, prefix);
      row.orders += 1;
      row.revenue += Number(order.total || 0);
    }

    return [...rows.values()]
      .map((row) => ({ ...row, orderRate: this.percent(row.orders, row.checkouts) }))
      .sort((a, b) => b.revenue - a.revenue || b.checkouts - a.checkouts || b.events - a.events)
      .slice(0, 20);
  }

  private dimensionPerformance(events: any[], field: "device" | "referrer") {
    const rows = new Map<string, any>();
    for (const event of events) {
      const label = event[field] || (field === "referrer" ? "Direct" : "Unknown");
      if (!rows.has(label)) {
        rows.set(label, { label, views: 0, adds: 0, checkouts: 0, payments: 0, total: 0 });
      }
      const row = rows.get(label);
      row.total += 1;
      if (event.name === "product_view") row.views += 1;
      if (event.name === "add_to_cart") row.adds += 1;
      if (event.name === "checkout_started") row.checkouts += 1;
      if (event.name === "payment_success") row.payments += 1;
    }

    return [...rows.values()]
      .map((row) => ({ ...row, cartRate: this.percent(row.adds, row.views), paymentRate: this.percent(row.payments, row.checkouts) }))
      .sort((a, b) => b.payments - a.payments || b.checkouts - a.checkouts || b.total - a.total)
      .slice(0, 20);
  }

  private customerActivity(events: any[], orders: any[]) {
    const rows = new Map<string, any>();
    for (const event of events) {
      const key = event.userId || event.sessionId;
      if (!key) continue;
      if (!rows.has(key)) {
        rows.set(key, { id: key, userId: event.userId || null, sessionId: event.sessionId || null, events: 0, checkouts: 0, payments: 0, orders: 0, revenue: 0, lastSeen: event.createdAt });
      }
      const row = rows.get(key);
      row.events += 1;
      if (event.name === "checkout_started") row.checkouts += 1;
      if (event.name === "payment_success") row.payments += 1;
      if (new Date(event.createdAt) > new Date(row.lastSeen)) row.lastSeen = event.createdAt;
    }

    for (const order of orders) {
      const key = order.userId;
      if (!rows.has(key)) {
        rows.set(key, { id: key, userId: key, sessionId: null, events: 0, checkouts: 0, payments: 0, orders: 0, revenue: 0, lastSeen: order.createdAt });
      }
      const row = rows.get(key);
      row.name = order.user?.name || row.name;
      row.email = order.user?.email || row.email;
      row.phone = order.user?.phone || row.phone;
      row.orders += 1;
      row.revenue += Number(order.total || 0);
      if (new Date(order.createdAt) > new Date(row.lastSeen)) row.lastSeen = order.createdAt;
    }

    return [...rows.values()]
      .sort((a, b) => b.revenue - a.revenue || b.payments - a.payments || b.events - a.events)
      .slice(0, 20);
  }
}
