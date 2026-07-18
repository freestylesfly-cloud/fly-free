import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('order-confirmation')
  async sendOrderConfirmation(@Body() payload: { email: string; order: any }) {
    return this.emailService.sendOrderConfirmation(payload.email, payload.order);
  }

  @Post('order-status-update')
  async sendOrderStatusUpdate(@Body() payload: { email: string; order: any }) {
    return this.emailService.sendOrderStatusUpdate(payload.email, payload.order);
  }

  @Post('invoice')
  async sendInvoice(@Body() payload: { email: string; order: any; invoicePdf: string }) {
    const invoiceBuffer = Buffer.from(payload.invoicePdf, 'base64');
    return this.emailService.sendInvoice(payload.email, payload.order, invoiceBuffer);
  }

  @Post('referral-link')
  async sendReferralLink(@Body() payload: { email: string; userName: string; referralCode: string; discountPercent: number }) {
    return this.emailService.sendReferralLink(payload.email, payload.userName, payload.referralCode, payload.discountPercent);
  }

  @Post('influencer-code')
  async sendInfluencerCode(@Body() payload: { email: string; influencerName: string; code: string; discountPercent: number }) {
    return this.emailService.sendInfluencerCode(payload.email, payload.influencerName, payload.code, payload.discountPercent);
  }

  @Post('new-product')
  async sendNewProductNotification(@Body() payload: { email: string; product: any; userName: string }) {
    return this.emailService.sendNewProductNotification(payload.email, payload.product, payload.userName);
  }
}
