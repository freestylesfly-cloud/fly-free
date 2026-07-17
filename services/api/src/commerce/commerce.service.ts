import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommerceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, shippingAddress: true }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  createCheckout(body: { cartId: string; addressId: string; couponCode?: string }) {
    return {
      status: "PENDING_PAYMENT",
      provider: "RAZORPAY",
      cartId: body.cartId,
      addressId: body.addressId,
      couponCode: body.couponCode ?? null
    };
  }
}
