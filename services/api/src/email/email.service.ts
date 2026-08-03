import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log("SendGrid configured");
    } else {
      this.logger.warn("SENDGRID_API_KEY not set. Email sending disabled.");
    }
  }

  getStatus() {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    return {
      configured: Boolean(apiKey),
      provider: apiKey ? "sendgrid" : null,
      from: this.configService.get<string>("SENDGRID_FROM_EMAIL") || "noreply@flyfree.co.in"
    };
  }

  async sendEmail(to: string, subject: string, html: string) {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (!apiKey) {
      this.logger.warn(`Email not sent (SendGrid not configured): ${to}`);
      return { success: false, message: "Email service not configured" };
    }

    try {
      const msg = {
        to,
        from: this.configService.get<string>("SENDGRID_FROM_EMAIL") || "noreply@flyfree.co.in",
        subject,
        html
      };

      const result = await sgMail.send(msg as any);
      this.logger.log(`Email sent to ${to}`);
      return { success: true, messageId: result[0].headers["x-message-id"] };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
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
        <p style="color:#666;font-size:13px;">Wrong size? You can exchange within 30 days of delivery.</p>
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
        <p>${messages[order.status] || "Your order status has been updated."}</p>
        ${this.summaryBlock([
          ["Order #", order.orderNumber || order.id],
          ["Status", order.status || "UNKNOWN"]
        ])}
        ${this.button(`${this.webUrl()}/orders/${order.id}`, "View Order")}
      `
    );

    return this.sendEmail(email, `Order ${order.status} - Fly Free`, html);
  }

  async sendNewProductNotification(email: string, product: any) {
    const html = this.wrapTemplate(
      `New Product: ${product.name}`,
      `
        <p>Hi there!</p>
        <p>We just launched a new product you might love:</p>
        <h2>${this.escape(product.name)}</h2>
        <p>${this.escape(product.description || "")}</p>
        <p>Price: Rs ${this.money(product.price || 0)}</p>
        ${this.button(`${this.webUrl()}/products/${product.slug}`, "Shop Now")}
      `
    );

    return this.sendEmail(email, `New Product: ${product.name}`, html);
  }

  private wrapTemplate(title: string, content: string): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF4A4E; color: white; padding: 20px; text-align: center; }
            .footer { background: #f0f0f0; color: #666; font-size: 12px; padding: 20px; text-align: center; }
            a { color: #FF4A4E; text-decoration: none; }
            .btn { background: #FF4A4E; color: white; padding: 12px 24px; border-radius: 4px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fly Free</h1>
              <p>${title}</p>
            </div>
            <div style="padding: 20px;">
              ${content}
            </div>
            <div class="footer">
              <p>© 2026 Fly Free. All rights reserved.</p>
              <p><a href="${this.webUrl()}">Visit our website</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private button(href: string, text: string): string {
    return `<a href="${href}" class="btn">${text}</a>`;
  }

  private summaryBlock(items: Array<[string, string]>): string {
    return `
      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px;">
        ${items.map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`).join("")}
      </div>
    `;
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private money(paise: number): string {
    return (paise / 100).toFixed(2);
  }

  private formatDate(date: any): string {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  private webUrl(): string {
    return this.configService.get<string>("NEXT_PUBLIC_APP_URL") || "https://flyfree.co.in";
  }
}
