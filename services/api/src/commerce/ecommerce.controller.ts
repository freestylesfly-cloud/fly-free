import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from "@nestjs/common";
import { EcommerceService } from "./ecommerce.service";

@Controller("ecommerce")
export class EcommerceController {
  constructor(private readonly commerceService: EcommerceService) {}

  // ==================== WISHLIST ====================
  @Get("wishlist")
  getWishlist(@Headers("authorization") token: string) {
    return this.commerceService.getWishlist(token);
  }

  @Post("wishlist/:productId")
  addToWishlist(@Param("productId") productId: string, @Headers("authorization") token: string) {
    return this.commerceService.addToWishlist(productId, token);
  }

  @Delete("wishlist/:productId")
  removeFromWishlist(@Param("productId") productId: string, @Headers("authorization") token: string) {
    return this.commerceService.removeFromWishlist(productId, token);
  }

  // ==================== CART ====================
  @Get("cart")
  getCart(@Headers("authorization") token: string) {
    return this.commerceService.getCart(token);
  }

  @Post("cart")
  addToCart(@Body() body: { productId: string; variantId: string; quantity: number }, @Headers("authorization") token: string) {
    return this.commerceService.addToCart(body.productId, body.variantId, body.quantity, token);
  }

  @Put("cart/:cartItemId")
  updateCart(@Param("cartItemId") cartItemId: string, @Body() body: { quantity: number }) {
    return this.commerceService.updateCartItem(cartItemId, body.quantity);
  }

  @Delete("cart/:cartItemId")
  removeFromCart(@Param("cartItemId") cartItemId: string) {
    return this.commerceService.removeFromCart(cartItemId);
  }

  @Delete("cart")
  clearCart(@Headers("authorization") token: string) {
    return this.commerceService.clearCart(token);
  }

  // ==================== REVIEWS ====================
  @Get("products/:productId/reviews")
  getProductReviews(@Param("productId") productId: string, @Query("page") page?: string) {
    return this.commerceService.getProductReviews(productId, page ? parseInt(page) : 1);
  }

  @Post("products/:productId/reviews")
  createReview(
    @Param("productId") productId: string,
    @Body() body: { rating: number; title: string; comment: string },
    @Headers("authorization") token: string
  ) {
    return this.commerceService.createReview(productId, body.rating, body.title, body.comment, token);
  }

  @Put("reviews/:reviewId")
  updateReview(@Param("reviewId") reviewId: string, @Body() body: any) {
    return this.commerceService.updateReview(reviewId, body);
  }

  @Delete("reviews/:reviewId")
  deleteReview(@Param("reviewId") reviewId: string) {
    return this.commerceService.deleteReview(reviewId);
  }

  // ==================== ADDRESSES ====================
  @Get("addresses")
  getAddresses(@Headers("authorization") token: string) {
    return this.commerceService.getAddresses(token);
  }

  @Post("addresses")
  createAddress(@Body() body: any, @Headers("authorization") token: string) {
    return this.commerceService.createAddress(body, token);
  }

  @Put("addresses/:addressId")
  updateAddress(@Param("addressId") addressId: string, @Body() body: any) {
    return this.commerceService.updateAddress(addressId, body);
  }

  @Delete("addresses/:addressId")
  deleteAddress(@Param("addressId") addressId: string) {
    return this.commerceService.deleteAddress(addressId);
  }

  // ==================== COUPONS ====================
  @Get("coupons/:code")
  validateCoupon(@Param("code") code: string) {
    return this.commerceService.validateCoupon(code);
  }

  @Get("coupons")
  listCoupons(@Query("limit") limit?: string) {
    return this.commerceService.listCoupons(limit ? parseInt(limit) : 10);
  }

  // ==================== ORDER TRACKING ====================
  @Get("orders")
  getUserOrders(@Headers("authorization") token: string, @Query("status") status?: string) {
    return this.commerceService.getUserOrders(token, status);
  }

  @Get("orders/:orderId/track")
  trackOrder(@Param("orderId") orderId: string) {
    return this.commerceService.trackOrder(orderId);
  }

  @Get("orders/:orderId/invoice")
  getOrderInvoice(@Param("orderId") orderId: string) {
    return this.commerceService.getOrderInvoice(orderId);
  }
}
