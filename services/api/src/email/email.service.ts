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
    this.initializeBrevo();
  }

  private initializeBrevo() {
    const apiKey = this.configService.get<string>("BREVO_API_KEY");
    const smtpUser = this.configService.get<string>("BREVO_SMTP_USER");

    if (!apiKey) {
      this.logger.warn("BREVO_API_KEY not set. Email sending disabled.");
      return;
    }

    if (!smtpUser) {
      this.logger.warn("BREVO_SMTP_USER not set. Email sending disabled.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: smtpUser,
        pass: apiKey
      }
    });

    this.logger.log("Brevo SMTP configured");
  }

  getStatus() {
    const apiKey = this.configService.get<string>("BREVO_API_KEY");
    return {
      configured: Boolean(this.transporter),
      provider: this.transporter ? "brevo" : null,
      from: this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in"
    };
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
          ["Status", order.status || "PLACED"]
        ])}
        <h3>Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">${rows}</table>
        ${this.summaryBlock([
          ["Subtotal", `Rs ${this.money(order.subtotal ?? order.total)}`],
          ...(Number(order.discount) > 0
            ? [["Discount", `- Rs ${this.money(order.discount)}`] as [string, string]]
            : []),
          ["Delivery", Number(order.shippingFee) > 0 ? `Rs ${this.money(order.shippingFee)}` : "FREE"],
          ["Total paid", `Rs ${this.money(order.total)}`]
        ])}
        <p><strong>Shipping Address:</strong></p>
        <p>${this.escape(address.street || address.line1 || "")}<br/>${this.escape(address.city || "")}, ${this.escape(address.state || "")} ${this.escape(address.zip || address.postalCode || "")}</p>
        ${this.button(`${this.webUrl()}/orders/${order.id}`, "Track Your Order")}
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
        ${this.button(`${this.webUrl()}/orders/${order.id}`, "View Order Details")}
      `
    );

    return this.sendEmail(email, `Order ${order.status} - ${order.orderNumber || order.id}`, html);
  }

  async sendInvoice(email: string, order: any, invoicePdf: Buffer) {
    const orderRef = order.orderNumber || order.id;
    const invoiceRef = order.invoiceNumber || orderRef;

    const html = this.wrapTemplate(
      "Your invoice",
      `
        <p>Hi ${this.escape(order.customerName || order.user?.name || "Customer")},</p>
        <p>The invoice for your order is attached as a PDF.</p>
        ${this.summaryBlock([
          ["Order", orderRef],
          ["Invoice", invoiceRef],
          ["Date", this.formatDate(order.createdAt || new Date())],
          ...(Number(order.subtotal) ? [["Subtotal", `Rs ${this.money(order.subtotal)}`] as [string, string]] : []),
          ...(Number(order.discount) > 0 ? [["Discount", `- Rs ${this.money(order.discount)}`] as [string, string]] : []),
          ["Delivery", Number(order.shippingFee) > 0 ? `Rs ${this.money(order.shippingFee)}` : "FREE"],
          ["Total paid", `Rs ${this.money(order.total)}`]
        ])}
        ${this.button(`${this.webUrl()}/orders/${order.id}`, "View Order")}
      `
    );

    return this.sendEmailWithAttachment(email, `Invoice ${invoiceRef} - Fly Free`, html, {
      filename: `flyfree-invoice-${invoiceRef}.pdf`,
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

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (Brevo not configured): ${to}`);
      return { success: false, message: "Email service not configured" };
    }

    try {
      const result = await this.transporter.sendMail({
        from: `Fly Free <${this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in"}>`,
        to,
        subject,
        html
      });

      this.logger.log(`Email sent to ${to}`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEmailWithAttachment(to: string, subject: string, html: string, attachment: MailAttachment) {
    if (!this.transporter) {
      this.logger.warn(`Email with attachment not sent (Brevo not configured): ${to}`);
      return { success: false, message: "Email service not configured" };
    }

    try {
      const result = await this.transporter.sendMail({
        from: `Fly Free <${this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in"}>`,
        to,
        subject,
        html,
        attachments: [attachment]
      });

      this.logger.log(`Email with attachment sent to ${to}`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email with attachment to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  private wrapTemplate(title: string, body: string) {
    const supportEmail = this.configService.get<string>("SUPPORT_EMAIL") || "freestylesfly@gmail.com";
    const webUrl = this.webUrl();

    return `
      <!DOCTYPE html>
      <html style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5;">
        <div style="max-width: 640px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF6B5B 0%, #4ECDC4 100%); padding: 32px 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fly Free</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Freedom, culture, comfort, self-expression</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 32px 24px; color: #1A1A1A; line-height: 1.6;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #FF6B5B;">${this.escape(title)}</h2>
            ${body}
          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 32px 24px; border-top: 1px solid #e0e0e0;">
            <!-- Company Info -->
            <div style="margin-bottom: 24px; font-size: 13px; color: #666; text-align: center;">
              <p style="margin: 0 0 8px 0;">
                <strong>Fly Free</strong><br>
                Guwahati, Assam, India
              </p>
              <p style="margin: 0 0 8px 0;">
                📧 ${this.escape(supportEmail)}<br>
                📱 +91 76388 89189
              </p>
            </div>

            <!-- Links -->
            <div style="text-align: center; margin-bottom: 24px; font-size: 12px;">
              <a href="${webUrl}/about" style="color: #FF6B5B; text-decoration: none; margin: 0 12px;">About</a> |
              <a href="${webUrl}/returns" style="color: #FF6B5B; text-decoration: none; margin: 0 12px;">Returns & Exchange</a> |
              <a href="${webUrl}/shipping" style="color: #FF6B5B; text-decoration: none; margin: 0 12px;">Shipping</a> |
              <a href="${webUrl}/privacy" style="color: #FF6B5B; text-decoration: none; margin: 0 12px;">Privacy</a> |
              <a href="${webUrl}/terms" style="color: #FF6B5B; text-decoration: none; margin: 0 12px;">Terms</a>
            </div>

            <!-- Social -->
            <div style="text-align: center; margin-bottom: 20px; font-size: 12px;">
              <a href="https://instagram.com/flyfree" style="color: #FF6B5B; text-decoration: none; margin: 0 8px;">Instagram</a>
            </div>

            <!-- Copyright & Unsubscribe -->
            <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 16px; font-size: 11px; color: #999;">
              <p style="margin: 0 0 8px 0;">© 2026 Fly Free. All rights reserved.</p>
              <p style="margin: 0;">✅ Secure checkout · 🔄 30-day exchange support</p>
            </div>
          </div>
        </div>
      </body>
      </html>
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

  webUrl() {
    return (
      this.configService.get<string>("WEB_URL") ||
      this.configService.get<string>("NEXT_PUBLIC_APP_URL") ||
      "http://localhost:3000"
    ).replace(/\/$/, "");
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
