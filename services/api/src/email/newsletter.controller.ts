import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';

@ApiTags('Newsletter')
@Controller()
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('newsletter/subscribe')
  async subscribe(@Body() body: { email: string; source?: string }) {
    return this.newsletterService.subscribe(body.email, body.source || 'footer');
  }

  @Post('newsletter/unsubscribe')
  async unsubscribe(@Body() body: { email: string }) {
    return this.newsletterService.unsubscribe(body.email);
  }

  @Get('admin/newsletter/subscribers')
  async getSubscribers(@Query('activeOnly') activeOnly?: string) {
    return this.newsletterService.listSubscribers(activeOnly === 'true');
  }

  @Get('admin/newsletter/stats')
  async getStats() {
    return this.newsletterService.getStats();
  }
}
