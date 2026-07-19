import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommerceService } from "./commerce.service";

@ApiTags("🛍️ Commerce")
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
