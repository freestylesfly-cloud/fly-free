import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommerceService } from "./commerce.service";

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
}
