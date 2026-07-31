import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, source = 'footer') {
    const normalizedEmail = this.normalizeEmail(email);

    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: {
        isActive: true,
        source,
        unsubscribedAt: null
      },
      create: {
        email: normalizedEmail,
        source,
        isActive: true
      }
    });

    await this.prisma.notification.create({
      data: {
        channel: 'ADMIN',
        type: 'NEWSLETTER_SUBSCRIBE',
        entityType: 'NEWSLETTER',
        entityId: subscriber.id,
        title: 'New newsletter subscriber',
        body: `${normalizedEmail} subscribed from ${source}.`,
        status: 'UNREAD'
      }
    });

    return {
      message: 'Subscribed successfully',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        isActive: subscriber.isActive
      }
    };
  }

  async unsubscribe(email: string) {
    const normalizedEmail = this.normalizeEmail(email);

    const subscriber = await this.prisma.newsletterSubscriber.update({
      where: { email: normalizedEmail },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });

    return {
      message: 'Unsubscribed successfully',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        isActive: subscriber.isActive
      }
    };
  }

  async listSubscribers(activeOnly = false) {
    return this.prisma.newsletterSubscriber.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { subscribedAt: 'desc' }
    });
  }

  async getStats() {
    const [total, active, unsubscribed] = await Promise.all([
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: false } })
    ]);

    return { total, active, unsubscribed };
  }

  private normalizeEmail(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('Please enter a valid email address');
    }

    return normalizedEmail;
  }
}
