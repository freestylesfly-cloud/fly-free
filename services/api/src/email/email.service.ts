import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Using Gmail SMTP (Free option)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password',
      },
    });
  }

  async sendOrderConfirmation(email: string, order: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <img src="cid:logo" style="height: 40px; margin-bottom: 10px;" alt="Fly Free" />
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${order.customerName},</p>
          <p>Thank you for your order! Here are your order details:</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₹${order.total.toLocaleString()}</p>
            <p><strong>Status:</strong> <span style="background: #4ECDC4; color: white; padding: 5px 10px; border-radius: 4px;">${order.status}</span></p>
          </div>

          <h3>Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${order.items.map((item: any) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px;">Qty: ${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">₹${item.price.toLocaleString()}</td>
              </tr>
            `).join('')}
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
            <p><strong>Shipping Address:</strong></p>
            <p>${order.shippingAddress.street}<br/>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.WEB_URL}/orders/${order.id}/track"
               style="background: #FF6B5B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Track Your Order
            </a>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>Questions? Contact us at support@flyfree.com | 1-800-FLY-FREE</p>
            <p>&copy; 2026 Fly Free. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Order Confirmation - Fly Free', html);
  }

  async sendOrderStatusUpdate(email: string, order: any) {
    const statusMessages = {
      CONFIRMED: '✅ Your order has been confirmed and is being prepared',
      SHIPPED: '📦 Your order is on the way!',
      DELIVERED: '🎉 Your order has been delivered!',
      CANCELLED: '❌ Your order has been cancelled',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Order Status Update</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${order.customerName},</p>
          <p style="font-size: 18px; color: #FF6B5B; font-weight: bold;">
            ${statusMessages[order.status] || `Your order status: ${order.status}`}
          </p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Current Status:</strong> ${order.status}</p>
            ${order.trackingNumber ? `<p><strong>Tracking #:</strong> ${order.trackingNumber}</p>` : ''}
            <p><strong>Expected Delivery:</strong> ${new Date(order.expectedDelivery).toLocaleDateString()}</p>
          </div>

          <a href="${process.env.WEB_URL}/orders/${order.id}/track"
             style="display: inline-block; background: #FF6B5B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Full Details
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(email, `Order ${order.status} - ${order.orderNumber}`, html);
  }

  async sendInvoice(email: string, order: any, invoicePdf: Buffer) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Invoice Attached</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${order.customerName},</p>
          <p>Your invoice for order #${order.orderNumber} is attached below.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ₹${order.total.toLocaleString()}</p>
          </div>

          <p>Thank you for shopping with Fly Free!</p>
        </div>
      </div>
    `;

    return this.sendEmailWithAttachment(
      email,
      `Invoice - Order ${order.orderNumber}`,
      html,
      {
        filename: `invoice-${order.orderNumber}.pdf`,
        content: invoicePdf,
      }
    );
  }

  async sendReferralLink(email: string, userName: string, referralCode: string, discountPercent: number) {
    const referralLink = `${process.env.WEB_URL}?ref=${referralCode}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Share & Earn!</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${userName},</p>
          <p>Your referral link is ready! Share it with friends and earn <strong>${discountPercent}% discount</strong> on your next purchase when they use your code.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B5B;">
            <p><strong>Your Referral Code:</strong></p>
            <p style="font-size: 24px; font-weight: bold; color: #FF6B5B; margin: 10px 0;">${referralCode}</p>
            <p style="font-size: 12px; color: #666; margin: 10px 0;">Or share this link:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
              ${referralLink}
            </p>
          </div>

          <h3>How It Works:</h3>
          <ol>
            <li>Share your code with friends</li>
            <li>They use your code at checkout</li>
            <li>They get ${discountPercent}% off their first order</li>
            <li>You get ${discountPercent}% discount on your next order!</li>
          </ol>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${referralLink}"
               style="background: #FF6B5B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Share Now
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Your Fly Free Referral Link', html);
  }

  async sendInfluencerCode(email: string, influencerName: string, code: string, discountPercent: number) {
    const trackingLink = `${process.env.WEB_URL}?promo=${code}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FFD93D, #6BCB77); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Your Influencer Code</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${influencerName},</p>
          <p>Welcome to the Fly Free Influencer Program! Here's your exclusive promo code:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #6BCB77;">
            <p><strong>Your Promo Code:</strong></p>
            <p style="font-size: 32px; font-weight: bold; color: #6BCB77; margin: 10px 0; letter-spacing: 2px;">${code}</p>
            <p><strong>Discount:</strong> ${discountPercent}% off</p>
          </div>

          <h3>Tracking Dashboard:</h3>
          <p>Monitor your clicks and sales:</p>
          <a href="${process.env.API_URL}/influencer/dashboard/${code}"
             style="display: inline-block; background: #6BCB77; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Dashboard
          </a>

          <h3>Your Promotion Link:</h3>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
            ${trackingLink}
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

          <h3>How to Promote:</h3>
          <ul>
            <li>Share your code on social media</li>
            <li>Include it in product reviews</li>
            <li>Post unboxing videos with your code</li>
            <li>Earn commission on every sale!</li>
          </ul>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: white; border-radius: 8px;">
            <p><strong>Need Help?</strong></p>
            <p>Contact: influencer@flyfree.com</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, 'Your Fly Free Influencer Code', html);
  }

  async sendNewProductNotification(email: string, product: any, userName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🆕 New Product Alert!</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${userName},</p>
          <p>We just launched something amazing you might love!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <img src="${product.image}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;" alt="${product.name}" />
            <h2 style="margin: 10px 0; color: #333;">${product.name}</h2>
            <p style="color: #666; margin: 10px 0;">${product.description}</p>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
              <div>
                <p style="color: #999; text-decoration: line-through; margin: 0;">₹${product.mrp.toLocaleString()}</p>
                <p style="font-size: 24px; font-weight: bold; color: #FF6B5B; margin: 5px 0;">₹${product.price.toLocaleString()}</p>
                ${product.discount > 0 ? `<p style="background: #FF6B5B; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold;">${product.discount}% OFF</p>` : ''}
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.WEB_URL}/products/${product.slug}"
               style="background: #FF6B5B; color: white; padding: 12px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              Shop Now
            </a>
          </div>

          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            You're receiving this because you subscribed to product notifications.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, `New Product: ${product.name}`, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `Fly Free <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });

      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email error:', error);
      throw error;
    }
  }

  private async sendEmailWithAttachment(
    to: string,
    subject: string,
    html: string,
    attachment: { filename: string; content: Buffer }
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: `Fly Free <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: [attachment],
      });

      console.log('✅ Email with attachment sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email error:', error);
      throw error;
    }
  }
}
