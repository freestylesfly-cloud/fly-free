import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type MailAttachment = {
  filename: string;
  content: Buffer;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  getStatus() {
    return {
      configured: Boolean(this.transporter),
      provider: this.transporter ? "gmail-smtp" : null,
      from: this.configService.get<string>("GMAIL_USER") || null
    };
  }

  private initializeTransporter() {
    const user = this.configService.get<string>("GMAIL_USER");
    const pass = this.configService.get<string>("GMAIL_APP_PASSWORD");

    if (!user || !pass) {
      this.logger.warn("SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD to enable email sending.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }

  async sendOrderConfirmation(email: string, order: any) {
    const rows = (order.items || [])
      .map(
        (item: any) => `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${this.escape(item.name || item.product?.name || "Product")}</td>
            <td style="padding: 10px;">Qty: ${Number(item.quantity || 1)}</td>
            <td style="padding: 10px; text-align: right;">Rs ${this.money(item.price || item.unitPrice || 0)}</td>
          </tr>`
      )
      .join("");

    const address = order.shippingAddress || {};
    const html = this.wrapTemplate(
      "Order Confirmed",
      `
        <p>Hi ${this.escape(order.customerName || order.user?.name || "Customer")},</p>
        <p>Thank you for your order. Here are your order details:</p>
        ${this.summaryBlock([
          ["Order #", order.orderNumber || order.id],
          ["Date", this.formatDate(order.createdAt)],
          ["Amount", `Rs ${this.money(order.total)}`],
          ["Status", order.status || "PLACED"]
        ])}
        <h3>Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">${rows}</table>
        <p><strong>Shipping Address:</strong></p>
        <p>${this.escape(address.street || address.line1 || "")}<br/>${this.escape(address.city || "")}, ${this.escape(address.state || "")} ${this.escape(address.zip || address.postalCode || "")}</p>
        ${this.button(`${this.webUrl()}/orders/${order.id}/track`, "Track Your Order")}
      `
    );

    return this.sendEmail(email, "Order Confirmation - Fly Free", html);
  }

  async sendOrderStatusUpdate(email: string, order: any) {
    const messages: Record<string, string> = {
      CONFIRMED: "Your order has been confirmed and is being prepared.",
      PACKED: "Your order is packed and ready to ship.",
      SHIPPED: "Your order is on the way.",
      DELIVERED: "Your order has been delivered.",
      CANCELLED: "Your order has been cancelled.",
      REFUNDED: "Your order has been refunded."
    };

    const html = this.wrapTemplate(
      "Order Status Update",
      `
        <p>Hi ${this.escape(order.customerName || order.user?.name || "Customer")},</p>
        <p style="font-size: 18px; color: #FF6B5B; font-weight: bold;">${messages[order.status] || `Your order status is ${this.escape(order.status || "")}.`}</p>
        ${this.summaryBlock([
          ["Order #", order.orderNumber || order.id],
          ["Current Status", order.status],
          ["Tracking #", order.trackingNumber],
          ["Expected Delivery", order.expectedDelivery ? this.formatDate(order.expectedDelivery) : undefined]
        ])}
        ${this.button(`${this.webUrl()}/orders/${order.id}/track`, "View Order Details")}
      `
    );

    return this.sendEmail(email, `Order ${order.status} - ${order.orderNumber || order.id}`, html);
  }

  async sendInvoice(email: string, order: any, invoicePdf: Buffer) {
    const html = this.wrapTemplate(
      "Invoice Attached",
      `
        <p>Hi ${this.escape(order.customerName || order.user?.name || "Customer")},</p>
        <p>Your invoice for order #${this.escape(order.orderNumber || order.id)} is attached.</p>
        ${this.summaryBlock([
          ["Invoice Date", this.formatDate(new Date())],
          ["Total Amount", `Rs ${this.money(order.total)}`]
        ])}
        <p>Thank you for shopping with Fly Free.</p>
      `
    );

    return this.sendEmailWithAttachment(email, `Invoice - Order ${order.orderNumber || order.id}`, html, {
      filename: `invoice-${order.orderNumber || order.id}.pdf`,
      content: invoicePdf
    });
  }

  async sendReferralLink(email: string, userName: string, referralCode: string, discountPercent: number) {
    const referralLink = `${this.webUrl()}?ref=${encodeURIComponent(referralCode)}`;
    const html = this.wrapTemplate(
      "Share And Earn",
      `
        <p>Hi ${this.escape(userName)},</p>
        <p>Share your Fly Free referral code. Your friend gets ${discountPercent}% off, and you can earn rewards after a completed purchase.</p>
        ${this.codeBlock(referralCode, referralLink)}
        ${this.button(referralLink, "Open Referral Link")}
      `
    );

    return this.sendEmail(email, "Your Fly Free Referral Link", html);
  }

  async sendInfluencerCode(email: string, influencerName: string, code: string, discountPercent: number) {
    const trackingLink = `${this.webUrl()}?promo=${encodeURIComponent(code)}`;
    const html = this.wrapTemplate(
      "Influencer Promo Code",
      `
        <p>Hi ${this.escape(influencerName)},</p>
        <p>Your Fly Free influencer promo code is ready.</p>
        ${this.summaryBlock([
          ["Promo Code", code],
          ["Customer Discount", `${discountPercent}%`],
          ["Tracking Link", trackingLink]
        ])}
        ${this.button(trackingLink, "Open Promotion Link")}
      `
    );

    return this.sendEmail(email, "Your Fly Free Influencer Code", html);
  }

  async sendNewProductNotification(email: string, product: any, userName: string) {
    const html = this.wrapTemplate(
      "New Product Alert",
      `
        <p>Hi ${this.escape(userName)},</p>
        <p>A new Fly Free product is live.</p>
        <h2>${this.escape(product.name)}</h2>
        <p>${this.escape(product.description || "")}</p>
        <p><strong>Price:</strong> Rs ${this.money(product.price)}</p>
        ${this.button(`${this.webUrl()}/products/${product.slug}`, "Shop Now")}
      `
    );

    return this.sendEmail(email, `New Product: ${product.name}`, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    const transporter = this.requireTransporter();
    const info = await transporter.sendMail({
      from: `Fly Free <${this.configService.get<string>("GMAIL_USER")}>`,
      to,
      subject,
      html
    });

    this.logger.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  }

  private async sendEmailWithAttachment(to: string, subject: string, html: string, attachment: MailAttachment) {
    const transporter = this.requireTransporter();
    const info = await transporter.sendMail({
      from: `Fly Free <${this.configService.get<string>("GMAIL_USER")}>`,
      to,
      subject,
      html,
      attachments: [attachment]
    });

    this.logger.log(`Email with attachment sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  }

  private requireTransporter() {
    if (!this.transporter) {
      throw new BadRequestException("Email SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in services/api/.env.");
    }

    return this.transporter;
  }

  private wrapTemplate(title: string, body: string) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1A1A1A;">
        <div style="background: #1A1A1A; padding: 24px; color: white;">
          <h1 style="margin: 0;">${this.escape(title)}</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,.72);">Fly Free</p>
        </div>
        <div style="padding: 24px; background: #fafafa;">${body}</div>
        <div style="padding: 16px 24px; color: #666; font-size: 12px;">
          <p>Need help? Contact ${this.escape(this.configService.get<string>("SUPPORT_EMAIL") || "support@flyfree.com")}.</p>
        </div>
      </div>
    `;
  }

  private summaryBlock(rows: Array<[string, unknown]>) {
    const content = rows
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(
        ([label, value]) => `
          <p style="margin: 6px 0;"><strong>${this.escape(label)}:</strong> ${this.escape(String(value))}</p>`
      )
      .join("");

    return `<div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0;">${content}</div>`;
  }

  private codeBlock(code: string, link: string) {
    return `
      <div style="background: white; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B5B;">
        <p style="margin: 0 0 8px;"><strong>Your Code</strong></p>
        <p style="font-size: 24px; font-weight: bold; color: #FF6B5B; margin: 0 0 12px;">${this.escape(code)}</p>
        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">${this.escape(link)}</p>
      </div>
    `;
  }

  private button(href: string, label: string) {
    return `
      <p style="margin-top: 24px;">
        <a href="${this.escape(href)}" style="display: inline-block; background: #FF6B5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${this.escape(label)}</a>
      </p>
    `;
  }

  private money(value: unknown) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  private formatDate(value: unknown) {
    if (!value) return "";
    return new Date(value as string).toLocaleDateString("en-IN");
  }

  private webUrl() {
    return this.configService.get<string>("WEB_URL") || "http://localhost:3000";
  }

  private escape(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
