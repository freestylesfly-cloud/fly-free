import { BadRequestException, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

type MailAttachment = {
  filename: string;
  content: Buffer;
};

export type EmailTemplateOptions = {
  /** Headline shown at the top of the card and used as the <title>. */
  title: string;
  /** Small uppercase label above the headline (optional). */
  eyebrow?: string;
  /** Inbox preview text. Falls back to the title. */
  preheader?: string;
  /** Pre-rendered HTML body. */
  body: string;
  /** Adds an unsubscribe line + List-Unsubscribe header for marketing sends. */
  unsubscribeUrl?: string;
};

type SendOptions = {
  unsubscribeUrl?: string;
};

const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** Contact block printed in every email footer. Blank fields are not rendered. */
type ContactDetails = {
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  instagramUrl: string;
};

const EMPTY_CONTACT: ContactDetails = {
  supportEmail: "",
  supportPhone: "",
  businessAddress: "",
  instagramUrl: ""
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private httpApiKey: string | null = null;

  /**
   * Cached copy of Admin → Settings. `renderEmail` is synchronous and called
   * from ~20 places, so the footer reads this snapshot rather than the database;
   * `refreshContactDetails()` re-reads it on boot and whenever an admin saves.
   */
  private contact: ContactDetails = EMPTY_CONTACT;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.initializeBrevo();
  }

  async onModuleInit() {
    await this.refreshContactDetails();
  }

  /** Reloads the footer contact block from Admin → Settings. */
  async refreshContactDetails() {
    try {
      const setting = await this.prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
      const value = (setting?.value || {}) as any;
      const text = (raw: unknown) => String(raw ?? "").trim();

      this.contact = {
        supportEmail: text(value.supportEmail || value.contactEmail || this.configService.get("SUPPORT_EMAIL")),
        supportPhone: text(value.contactPhone || this.configService.get("SUPPORT_PHONE")),
        businessAddress: text(value.businessAddress),
        instagramUrl: text(value.socialLinks?.instagram || this.configService.get("INSTAGRAM_URL"))
      };
    } catch (error) {
      // A settings read failure must not stop an order confirmation going out.
      this.logger.warn(`Could not load contact details for email footers: ${error}`);
    }
  }

  /**
   * Brevo can be driven two ways and the key prefix tells us which one we hold:
   *   xkeysib-*  -> HTTPS API  (preferred: no SMTP egress, no IP allowlist)
   *   xsmtpsib-* -> SMTP relay (fallback: needs BREVO_SMTP_USER + an authorized IP)
   */
  private initializeBrevo() {
    const apiKey = (this.configService.get<string>("BREVO_API_KEY") || "").trim();
    const smtpKey = (this.configService.get<string>("BREVO_SMTP_KEY") || "").trim();
    const smtpUser = (this.configService.get<string>("BREVO_SMTP_USER") || "").trim();

    const httpKey = [apiKey, smtpKey].filter(this.isUsableKey.bind(this)).find((key) => key.startsWith("xkeysib-"));
    const relayKey = [smtpKey, apiKey].filter(this.isUsableKey.bind(this)).find((key) => key.startsWith("xsmtpsib-"));

    if (httpKey) {
      this.httpApiKey = httpKey;
      this.logger.log("Brevo HTTP API configured");
    }

    if (relayKey && smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: relayKey },
        connectionTimeout: 10000,
        socketTimeout: 10000
      });
      this.logger.log(this.httpApiKey ? "Brevo SMTP configured (fallback)" : "Brevo SMTP configured");
    }

    if (!this.httpApiKey && !this.transporter) {
      this.logger.warn(
        "Email sending disabled. Set BREVO_API_KEY to an xkeysib-* API key, or an xsmtpsib-* SMTP key together with BREVO_SMTP_USER."
      );
    }
  }

  /**
   * A key pasted from an abbreviated doc keeps the "..." and blows up deep inside
   * fetch() with an unreadable ByteString error. Catch it here instead.
   */
  private isUsableKey(key: string) {
    if (!key) return false;

    const badChar = [...key].find((char) => char.charCodeAt(0) > 126 || char.charCodeAt(0) < 33);
    if (badChar) {
      this.logger.error(
        `Brevo key is not valid: it contains "${badChar}" at index ${key.indexOf(badChar)}. ` +
          "This usually means a truncated copy/paste - set the complete key with no ellipsis or spaces."
      );
      return false;
    }

    return true;
  }

  getStatus() {
    return {
      configured: Boolean(this.httpApiKey || this.transporter),
      provider: this.httpApiKey ? "brevo-api" : this.transporter ? "brevo-smtp" : null,
      from: this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in"
    };
  }

  /** Sends over the HTTPS API. Works from any IP and needs no SMTP egress. */
  private async sendViaHttpApi(payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
    attachment?: MailAttachment;
  }) {
    const fromEmail = this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in";
    const fromName = this.configService.get<string>("EMAIL_FROM_NAME") || "Fly Free";
    const replyTo = this.configService.get<string>("SUPPORT_EMAIL");

    const response = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": this.httpApiKey as string,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        ...(payload.headers ? { headers: payload.headers } : {}),
        ...(payload.attachment
          ? {
              attachment: [
                {
                  name: payload.attachment.filename,
                  content: payload.attachment.content.toString("base64")
                }
              ]
            }
          : {})
      }),
      signal: AbortSignal.timeout(15000)
    });

    const body = await response.text();

    if (!response.ok) {
      // Brevo returns { code, message } - surface the message, not a bare status.
      let detail = body;
      try {
        detail = JSON.parse(body).message || body;
      } catch {
        /* keep raw body */
      }
      throw new Error(`Brevo API ${response.status}: ${detail}`);
    }

    try {
      return JSON.parse(body).messageId as string;
    } catch {
      return undefined;
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

  async sendEmail(to: string, subject: string, html: string, options: SendOptions = {}) {
    const headers = options.unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      : undefined;

    return this.deliver({ to, subject, html, headers });
  }

  async sendEmailWithAttachment(to: string, subject: string, html: string, attachment: MailAttachment) {
    return this.deliver({ to, subject, html, attachment });
  }

  /**
   * Single delivery path. Tries the HTTPS API first and falls back to the SMTP
   * relay, so a blocked SMTP port or an unauthorized IP does not lose the email.
   */
  private async deliver(payload: {
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
    attachment?: MailAttachment;
  }) {
    const { to, subject, html, headers, attachment } = payload;
    const text = this.toPlainText(html);

    if (!this.httpApiKey && !this.transporter) {
      this.logger.warn(`Email not sent (Brevo not configured): ${to}`);
      return { success: false, message: "Email service not configured" };
    }

    let lastError = "";

    if (this.httpApiKey) {
      try {
        const messageId = await this.sendViaHttpApi({ to, subject, html, text, headers, attachment });
        this.logger.log(`Email sent to ${to} via Brevo API`);
        return { success: true, messageId };
      } catch (error: any) {
        lastError = error?.message || "Brevo API request failed";
        this.logger.warn(`Brevo API send to ${to} failed: ${lastError}`);
      }
    }

    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail({
          from: this.fromAddress(),
          replyTo: this.configService.get<string>("SUPPORT_EMAIL") || undefined,
          to,
          subject,
          html,
          text,
          headers,
          attachments: attachment ? [attachment] : undefined
        });

        this.logger.log(`Email sent to ${to} via Brevo SMTP`);
        return { success: true, messageId: result.messageId };
      } catch (error: any) {
        lastError = error?.message || "SMTP send failed";
      }
    }

    this.logger.error(`Failed to send email to ${to}: ${lastError}`);
    return { success: false, error: lastError };
  }

  /**
   * Branded email shell used by every Fly Free email.
   * Table based + inline styles so it renders the same in Gmail, Outlook and Apple Mail.
   */
  renderEmail(options: EmailTemplateOptions) {
    const { title, eyebrow, preheader, body, unsubscribeUrl } = options;
    const { supportEmail, supportPhone, businessAddress, instagramUrl } = this.contact;
    const webUrl = this.webUrl();

    // "Write to X or call Y" has to survive either half being unconfigured.
    const helpChannels = [
      supportEmail &&
        `write to <a href="mailto:${this.escape(supportEmail)}" style="color:#FF6B5B;text-decoration:none;">${this.escape(supportEmail)}</a>`,
      supportPhone &&
        `call <a href="tel:${this.escape(supportPhone.replace(/\s/g, ""))}" style="color:#FF6B5B;text-decoration:none;">${this.escape(supportPhone)}</a>`
    ].filter(Boolean) as string[];

    const footerLinks = [
      ["Shop", `${webUrl}/products`],
      ["About", `${webUrl}/about`],
      ["Returns & exchange", `${webUrl}/returns`],
      ["Shipping", `${webUrl}/shipping`],
      ["Privacy", `${webUrl}/privacy`],
      ["Terms", `${webUrl}/terms`]
    ]
      .map(
        ([label, href]) =>
          `<a href="${this.escape(href)}" style="color:#4A4A4A;text-decoration:none;font-size:12px;white-space:nowrap;">${this.escape(label)}</a>`
      )
      .join('<span style="color:#C9C9C9;font-size:12px;padding:0 8px;">&middot;</span>');

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${this.escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F0;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${this.escape(preheader || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F2F0;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Brand bar -->
          <tr>
            <td style="background-color:#111111;padding:26px 32px;" align="left">
              <a href="${this.escape(webUrl)}" style="text-decoration:none;">
                <span style="display:inline-block;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:3px;color:#FFFFFF;text-transform:uppercase;">Fly&nbsp;Free</span>
              </a>
              <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;color:#9A9A9A;text-transform:uppercase;padding-top:6px;">Freedom &middot; Culture &middot; Comfort</div>
            </td>
          </tr>
          <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#FF6B5B;">&nbsp;</td></tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px 32px 8px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1A1A;">
              ${
                eyebrow
                  ? `<div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#FF6B5B;padding-bottom:10px;">${this.escape(eyebrow)}</div>`
                  : ""
              }
              <h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.25;font-weight:700;color:#111111;">${this.escape(title)}</h1>
              <div style="font-size:15px;line-height:1.65;color:#3A3A3A;">
                ${body}
              </div>
            </td>
          </tr>

          <!-- Support strip -->
          ${
            helpChannels.length
              ? `<tr>
            <td style="padding:28px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDEDED;">
                <tr>
                  <td style="padding-top:20px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6A6A6A;">
                    Need help? ${helpChannels.join(" or ")}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF8;border-radius:10px;">
                <tr>
                  <td align="center" style="padding:22px 20px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                    <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#111111;">Fly Free</div>
                    <div style="font-size:12px;line-height:1.6;color:#6A6A6A;padding-top:6px;">
                      Premium tees &amp; custom-crafted apparel
                      ${businessAddress ? `<br />${this.escape(businessAddress)}` : ""}
                    </div>
                    <div style="padding:16px 0 4px 0;line-height:2;">${footerLinks}</div>
                    ${
                      instagramUrl
                        ? `<div style="padding-top:8px;">
                      <a href="${this.escape(instagramUrl)}" style="color:#FF6B5B;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a>
                    </div>`
                        : ""
                    }
                    <div style="border-top:1px solid #E6E6E2;margin-top:18px;padding-top:14px;font-size:11px;line-height:1.7;color:#9A9A9A;">
                      Secure checkout &middot; 30-day exchange support<br />
                      &copy; ${new Date().getFullYear()} Fly Free. All rights reserved.
                      ${
                        unsubscribeUrl
                          ? `<br /><a href="${this.escape(unsubscribeUrl)}" style="color:#9A9A9A;text-decoration:underline;">Unsubscribe from marketing emails</a>`
                          : ""
                      }
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private wrapTemplate(title: string, body: string, options: Partial<EmailTemplateOptions> = {}) {
    return this.renderEmail({ title, body, ...options });
  }

  /** Key/value summary card (order details, promo details, etc). */
  summaryBlock(rows: Array<[string, unknown]>) {
    const content = rows
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(
        ([label, value]) => `
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#6A6A6A;width:45%;">${this.escape(label)}</td>
            <td style="padding:7px 0;font-size:14px;color:#111111;font-weight:600;text-align:right;word-break:break-word;">${this.escape(String(value))}</td>
          </tr>`
      )
      .join("");

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF8;border:1px solid #EDEDE9;border-radius:10px;margin:22px 0;">
        <tr>
          <td style="padding:6px 18px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${content}</table>
          </td>
        </tr>
      </table>
    `;
  }

  /** Highlighted card for a promo/referral code plus its link. */
  codeBlock(code: string, link?: string, caption = "Your code") {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF6F4;border:1px solid #FFD9D3;border-radius:10px;margin:22px 0;">
        <tr>
          <td align="center" style="padding:22px 18px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#B4483B;">${this.escape(caption)}</div>
            <div style="font-size:28px;font-weight:700;letter-spacing:4px;color:#111111;padding:10px 0;">${this.escape(code)}</div>
            ${
              link
                ? `<div style="font-size:12px;color:#6A6A6A;word-break:break-all;">${this.escape(link)}</div>`
                : ""
            }
          </td>
        </tr>
      </table>
    `;
  }

  /** One-time passcode card used by signup verification and password reset. */
  otpBlock(code: string, expiryNote: string) {
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;border-radius:10px;margin:24px 0;">
        <tr>
          <td align="center" style="padding:26px 18px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9A9A9A;">Verification code</div>
            <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#FFFFFF;padding:12px 0 6px 0;">${this.escape(code)}</div>
            <div style="font-size:12px;color:#9A9A9A;">${this.escape(expiryNote)}</div>
          </td>
        </tr>
      </table>
    `;
  }

  /** Primary call-to-action button (bulletproof enough for Outlook). */
  button(href: string, label: string) {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
        <tr>
          <td align="center" bgcolor="#FF6B5B" style="border-radius:8px;">
            <a href="${this.escape(href)}" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;">${this.escape(label)}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px 0;font-size:12px;color:#9A9A9A;line-height:1.6;">If the button does not work, copy this link into your browser:<br /><span style="color:#6A6A6A;word-break:break-all;">${this.escape(href)}</span></p>
    `;
  }

  /** Turns admin-authored plain text into safe paragraphs with clickable links. */
  paragraphs(text: string) {
    return String(text || "")
      .split(/\n{2,}|\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p style="margin:0 0 14px 0;">${this.linkify(this.escape(line))}</p>`)
      .join("");
  }

  /** Makes bare URLs in admin-typed copy clickable. Input must already be escaped. */
  private linkify(escapedText: string) {
    return escapedText.replace(/https?:\/\/[^\s<]+/g, (match) => {
      // Keep sentence punctuation out of the href.
      const trailing = match.match(/[.,;:!?)]+$/)?.[0] ?? "";
      const url = trailing ? match.slice(0, -trailing.length) : match;
      return `<a href="${url}" style="color:#FF6B5B;text-decoration:none;font-weight:600;">${url}</a>${trailing}`;
    });
  }

  private money(value: unknown) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  private formatDate(value: unknown) {
    if (!value) return "";
    return new Date(value as string).toLocaleDateString("en-IN");
  }

  private fromAddress() {
    const fromName = this.configService.get<string>("EMAIL_FROM_NAME") || "Fly Free";
    const fromEmail = this.configService.get<string>("BREVO_EMAIL") || "noreply@flyfree.co.in";
    return `${fromName} <${fromEmail}>`;
  }

  /** Plain-text alternative. A text part is required by most spam filters. */
  private toPlainText(html: string) {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|h1|h2|h3|li|table)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&middot;/g, "-")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
  }

  unsubscribeUrl(email: string) {
    return `${this.webUrl()}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
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
