import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

type MarketingRecipient = {
  userId?: string;
  subscriberId?: string;
  email: string;
};

@Injectable()
export class EmailAdminService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  // Send review request email to user
  async sendReviewRequest(orderId: string, customMessage?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } } }
    });

    if (!order) throw new BadRequestException('Order not found');
    if (!order.user.email) throw new BadRequestException('Order user does not have an email address');

    const reviewLink = `${this.emailService.webUrl()}/orders/${orderId}/review`;
    const orderNumber = order.orderNumber || order.id;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">⭐ Share Your Experience</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${order.user.name},</p>
          <p>Thank you for your recent purchase! We'd love to hear what you think about your order.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B5B;">
            <p><strong>Order #${orderNumber}</strong></p>
            <p>Your items:</p>
            <ul>
              ${order.items.map((item: any) => `<li>${item.product.name} (Qty: ${item.quantity})</li>`).join('')}
            </ul>
          </div>

          <p>${customMessage || 'Your feedback helps us improve and helps other customers make informed decisions.'}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewLink}"
               style="background: #FF6B5B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Write Your Review
            </a>
          </div>

          <p style="font-size: 12px; color: #999;">Thank you for being a valued customer!</p>
        </div>
      </div>
    `;

    return this.emailService.sendEmail(order.user.email, `Share Your Experience - Order #${orderNumber}`, html);
  }

  // Send broadcast message to all users
  async sendBroadcastMessage(title: string, message: string, subject: string) {
    const recipients = await this.getMarketingRecipients();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">📢 ${title}</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi there,</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4;">
            ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
          </div>
          <p style="text-align: center; color: #999; font-size: 12px;">This is an important announcement from Fly Free</p>
        </div>
      </div>
    `;

    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.emailService.sendEmail(recipient.email, subject, this.withUnsubscribeLink(html, recipient.email));
        results.push({ userId: recipient.userId, subscriberId: recipient.subscriberId, email: recipient.email, status: 'sent', messageId: result.messageId });
      } catch (error: any) {
        results.push({ userId: recipient.userId, subscriberId: recipient.subscriberId, email: recipient.email, status: 'failed', error: error.message || 'Failed to send email' });
      }
    }

    return {
      totalRecipients: recipients.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      details: results
    };
  }

  // Send message to specific user
  async sendMessageToUser(userId: string, subject: string, message: string, attachmentBase64?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.email) throw new BadRequestException('User does not have an email address');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">📧 Message from Fly Free</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${user.name},</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
          </div>
          <p style="text-align: center; color: #999; font-size: 12px;">Questions? Contact support@flyfree.com</p>
        </div>
      </div>
    `;

    if (attachmentBase64) {
      const buffer = Buffer.from(attachmentBase64, 'base64');
      return this.emailService.sendEmailWithAttachment(user.email, subject, html, {
        filename: 'attachment.pdf',
        content: buffer
      });
    }

    return this.emailService.sendEmail(user.email, subject, html);
  }

  // Send invitation email
  async sendInviteEmail(email: string, message: string) {
    if (!email) throw new BadRequestException('Email is required');

    const inviteLink = `${this.emailService.webUrl()}/invite?email=${encodeURIComponent(email)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FF6B5B, #4ECDC4); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🎉 You're Invited to Fly Free!</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>You've been invited to join the Fly Free community!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B5B;">
            <p style="font-size: 16px; color: #FF6B5B; font-weight: bold;">
              ${message || 'Join us for amazing t-shirt designs and exclusive deals!'}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}"
               style="background: #FF6B5B; color: white; padding: 12px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              Accept Invite & Join Now
            </a>
          </div>

          <p style="font-size: 12px; color: #999; text-align: center;">Link valid for 30 days</p>
        </div>
      </div>
    `;

    return this.emailService.sendEmail(email, 'You\'re Invited to Fly Free!', html);
  }

  // Send promotional email to segment of users
  async sendPromotionalEmail(userIds: string[] | undefined, title: string, message: string, promoCode?: string, discount?: number) {
    const recipients = Array.isArray(userIds) && userIds.length > 0
      ? await this.getUserRecipients(userIds)
      : await this.getMarketingRecipients();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #FFD93D, #6BCB77); padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🎁 Special Offer</h1>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi there,</p>
          <h2 style="color: #6BCB77; text-align: center;">${title}</h2>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
          </div>

          ${promoCode ? `
            <div style="background: #FFD93D; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="color: #333; margin: 0;">Use promo code at checkout:</p>
              <p style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; margin: 10px 0;">
                ${promoCode}
              </p>
              ${discount ? `<p style="color: #333; margin: 0;">Get ${discount}% off your order!</p>` : ''}
            </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${this.emailService.webUrl()}"
               style="background: #6BCB77; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Shop Now
            </a>
          </div>
        </div>
      </div>
    `;

    const results = [];
    for (const recipient of recipients) {
      try {
        await this.emailService.sendEmail(recipient.email, title, this.withUnsubscribeLink(html, recipient.email));
        results.push({ userId: recipient.userId, subscriberId: recipient.subscriberId, email: recipient.email, status: 'sent' });
      } catch (error: any) {
        results.push({ userId: recipient.userId, subscriberId: recipient.subscriberId, email: recipient.email, status: 'failed', error: error.message || 'Failed to send email' });
      }
    }

    return {
      totalRecipients: recipients.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    };
  }

  // Get email statistics
  async getEmailStats() {
    const [totalUsers, totalOrders, deliveredOrders, invoices, subscribers, activeSubscribers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.invoice.count({ where: { sentAt: { not: null } } }),
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } })
    ]);

    return {
      totalUsers,
      subscribers,
      activeSubscribers,
      totalOrders,
      deliveredOrders,
      invoicesSent: invoices,
      estimatedEmailsSent: totalOrders + deliveredOrders + invoices,
      lastUpdated: new Date()
    };
  }

  private async getUserRecipients(userIds: string[]): Promise<MarketingRecipient[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, email: { not: null } },
      select: { id: true, email: true }
    });

    return users
      .filter((user): user is { id: string; email: string } => Boolean(user.email))
      .map((user) => ({ userId: user.id, email: user.email }));
  }

  private async getMarketingRecipients(): Promise<MarketingRecipient[]> {
    const [users, subscribers] = await Promise.all([
      this.prisma.user.findMany({
        where: { email: { not: null } },
        select: { id: true, email: true }
      }),
      this.prisma.newsletterSubscriber.findMany({
        select: { id: true, email: true, isActive: true }
      })
    ]);

    const recipients = new Map<string, { userId?: string; subscriberId?: string; email: string }>();
    const optedOutEmails = new Set(
      subscribers.filter((subscriber) => !subscriber.isActive).map((subscriber) => subscriber.email.toLowerCase())
    );

    for (const user of users) {
      if (user.email && !optedOutEmails.has(user.email.toLowerCase())) {
        recipients.set(user.email.toLowerCase(), { userId: user.id, email: user.email });
      }
    }

    for (const subscriber of subscribers.filter((item) => item.isActive)) {
      const key = subscriber.email.toLowerCase();
      recipients.set(key, { ...recipients.get(key), subscriberId: subscriber.id, email: subscriber.email });
    }

    return Array.from(recipients.values());
  }

  private withUnsubscribeLink(html: string, email: string) {
    const baseUrl = this.emailService.webUrl();
    const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    const footer = `<p style="text-align:center;color:#777;font-size:12px;margin-top:24px;">No longer want drop and offer emails? <a href="${unsubscribeUrl}" style="color:#FF6B5B;">Unsubscribe</a></p>`;

    return html.replace('</div>\n      </div>', `${footer}\n        </div>\n      </div>`);
  }
}
