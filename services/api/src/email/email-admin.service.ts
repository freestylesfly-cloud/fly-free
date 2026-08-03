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

    const html = this.emailService.renderEmail({
      eyebrow: 'Your feedback',
      title: 'How did we do?',
      preheader: `Tell us what you think about order #${orderNumber}`,
      body: `
        <p style="margin:0 0 14px 0;">Hi ${this.escape(order.user.name || 'there')},</p>
        <p style="margin:0 0 14px 0;">Thanks for your recent order. A short review helps us improve and helps other shoppers pick the right fit.</p>
        ${this.emailService.summaryBlock([
          ['Order', `#${orderNumber}`],
          ['Items', order.items.map((item: any) => `${item.product.name} x${item.quantity}`).join(', ')]
        ])}
        ${this.emailService.paragraphs(customMessage || 'It takes less than a minute, and every review is read by our team.')}
        ${this.emailService.button(reviewLink, 'Write your review')}
      `
    });

    return this.emailService.sendEmail(order.user.email, `How was order #${orderNumber}? - Fly Free`, html);
  }

  // Send broadcast message to all users
  async sendBroadcastMessage(title: string, message: string, subject: string) {
    const recipients = await this.getMarketingRecipients();

    const renderFor = (email: string) => {
      const unsubscribeUrl = this.emailService.unsubscribeUrl(email);
      return this.emailService.renderEmail({
        eyebrow: 'Announcement',
        title,
        preheader: subject,
        unsubscribeUrl,
        body: `
          <p style="margin:0 0 14px 0;">Hi there,</p>
          ${this.emailService.paragraphs(message)}
          ${this.emailService.button(this.emailService.webUrl(), 'Visit Fly Free')}
        `
      });
    };

    const results = [];
    for (const recipient of recipients) {
      try {
        const unsubscribeUrl = this.emailService.unsubscribeUrl(recipient.email);
        const result = await this.emailService.sendEmail(recipient.email, subject, renderFor(recipient.email), { unsubscribeUrl });
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

    const html = this.emailService.renderEmail({
      eyebrow: 'Message from Fly Free',
      title: subject,
      preheader: subject,
      body: `
        <p style="margin:0 0 14px 0;">Hi ${this.escape(user.name || 'there')},</p>
        ${this.emailService.paragraphs(message)}
      `
    });

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

    const inviteLink = `${this.emailService.webUrl()}/auth/signup?email=${encodeURIComponent(email)}&invited=1`;

    const html = this.emailService.renderEmail({
      eyebrow: 'Invitation',
      title: 'Your seat at Fly Free is ready',
      preheader: 'Create your account and get first access to new theme drops.',
      body: `
        <p style="margin:0 0 14px 0;">You have been invited to join the Fly Free community - premium tees, seasonal theme drops and custom-crafted apparel.</p>
        ${this.emailService.paragraphs(message || 'Create your account to get first access to new drops, restocks and member-only offers.')}
        ${this.emailService.button(inviteLink, 'Create your account')}
        <p style="margin:14px 0 0 0;font-size:12px;color:#9A9A9A;">This invite link stays active for 30 days. If you did not expect this email you can safely ignore it.</p>
      `
    });

    return this.emailService.sendEmail(email, 'You are invited to Fly Free', html);
  }

  // Send promotional email to segment of users
  async sendPromotionalEmail(userIds: string[] | undefined, title: string, message: string, promoCode?: string, discount?: number) {
    const recipients = Array.isArray(userIds) && userIds.length > 0
      ? await this.getUserRecipients(userIds)
      : await this.getMarketingRecipients();

    const shopUrl = promoCode
      ? `${this.emailService.webUrl()}/products?promo=${encodeURIComponent(promoCode)}`
      : `${this.emailService.webUrl()}/products`;

    const renderFor = (email: string) =>
      this.emailService.renderEmail({
        eyebrow: 'Special offer',
        title,
        preheader: promoCode ? `Use code ${promoCode} at checkout` : title,
        unsubscribeUrl: this.emailService.unsubscribeUrl(email),
        body: `
          <p style="margin:0 0 14px 0;">Hi there,</p>
          ${this.emailService.paragraphs(message)}
          ${
            promoCode
              ? this.emailService.codeBlock(
                  promoCode,
                  undefined,
                  discount ? `${discount}% off at checkout` : 'Use at checkout'
                )
              : ''
          }
          ${this.emailService.button(shopUrl, 'Shop the drop')}
        `
      });

    const results = [];
    for (const recipient of recipients) {
      try {
        const unsubscribeUrl = this.emailService.unsubscribeUrl(recipient.email);
        await this.emailService.sendEmail(recipient.email, title, renderFor(recipient.email), { unsubscribeUrl });
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

  private escape(value: string) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
