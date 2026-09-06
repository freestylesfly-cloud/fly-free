import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommerceService } from "./commerce.service";
import { AdminGuard } from "../auth/admin.guard";

@ApiTags("🛍️ Commerce")
@Controller("commerce")
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get("orders/:id")
  getOrder(@Param("id") id: string, @Headers("authorization") token: string) {
    return this.commerceService.getOrder(id, token);
  }

  @Post("checkout")
  createCheckout(@Body() body: any, @Headers("authorization") token: string) {
    return this.commerceService.createCheckout(body, token);
  }

  // Creates the order. There is no "retry payment" endpoint: a failed payment
  // leaves nothing behind, so the customer simply checks out again.
  @Post("checkout/verify")
  verifyCheckout(@Body() body: any, @Headers("authorization") token: string) {
    return this.commerceService.verifyCheckout(body, token);
  }

  @Post("webhooks/razorpay")
  razorpayWebhook(@Body() body: any, @Headers("x-razorpay-signature") signature: string, @Req() request: any) {
    return this.commerceService.handleRazorpayWebhook(body, signature, request.rawBody);
  }

  @Get("admin/payment-reconciliation")
  @UseGuards(AdminGuard)
  paymentReconciliation(@Query("search") search?: string, @Query("status") status?: string) {
    return this.commerceService.listPaymentReconciliation({ search, status });
  }

  @Post("admin/payment-reconciliation/:razorpayOrderId/recover")
  @UseGuards(AdminGuard)
  recoverPayment(@Param("razorpayOrderId") razorpayOrderId: string) {
    return this.commerceService.recoverPaymentSession(razorpayOrderId);
  }
}
