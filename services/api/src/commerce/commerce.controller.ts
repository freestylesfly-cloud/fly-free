import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CommerceService } from "./commerce.service";

@Controller("commerce")
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get("orders/:id")
  getOrder(@Param("id") id: string) {
    return this.commerceService.getOrder(id);
  }

  @Post("checkout")
  createCheckout(@Body() body: { cartId: string; addressId: string; couponCode?: string }) {
    return this.commerceService.createCheckout(body);
  }
}
