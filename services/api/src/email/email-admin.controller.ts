import { Controller, Post, Get, Body } from '@nestjs/common';
import { EmailAdminService } from './email-admin.service';

@Controller('admin/email')
export class EmailAdminController {
  constructor(private emailAdminService: EmailAdminService) {}

  @Get('stats')
  async getStats() {
    return this.emailAdminService.getEmailStats();
  }

  @Post('send-review-request')
  async sendReviewRequest(@Body() payload: { orderId: string; customMessage?: string }) {
    return this.emailAdminService.sendReviewRequest(payload.orderId, payload.customMessage);
  }

  @Post('send-broadcast')
  async sendBroadcast(@Body() payload: { title: string; message: string; subject: string }) {
    return this.emailAdminService.sendBroadcastMessage(payload.title, payload.message, payload.subject);
  }

  @Post('send-user-message')
  async sendUserMessage(@Body() payload: { userId: string; subject: string; message: string; attachmentBase64?: string }) {
    return this.emailAdminService.sendMessageToUser(
      payload.userId,
      payload.subject,
      payload.message,
      payload.attachmentBase64
    );
  }

  @Post('send-invite')
  async sendInvite(@Body() payload: { email: string; message?: string }) {
    return this.emailAdminService.sendInviteEmail(payload.email, payload.message ?? '');
  }

  @Post('send-promotional')
  async sendPromotional(@Body() payload: {
    userIds?: string[];
    title: string;
    message: string;
    promoCode?: string;
    discount?: number;
  }) {
    return this.emailAdminService.sendPromotionalEmail(
      payload.userIds,
      payload.title,
      payload.message,
      payload.promoCode,
      payload.discount
    );
  }
}
