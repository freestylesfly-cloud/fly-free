import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ReviewService } from "./review.service";
import { AdminGuard } from "../auth/admin.guard";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // Get reviews for a product (public)
  @ApiTags("⭐ Reviews")
  @Get("product/:productId")
  async getProductReviews(
    @Param("productId") productId: string,
    @Query("page") page?: string
  ) {
    return await this.reviewService.getProductReviews(productId, parseInt(page || "1"));
  }

  // Get latest approved reviews across all products (public, for homepage)
  @ApiTags("⭐ Reviews")
  @Get("latest")
  async getLatestReviews(@Query("limit") limit?: string) {
    return await this.reviewService.getLatestReviews(parseInt(limit || "8"));
  }

  // Upload review images (base64 data URLs)
  @ApiTags("⭐ Reviews")
  @Post("upload-images")
  async uploadImages(
    @Body() body: { images: string[] },
    @Headers("authorization") auth?: string
  ) {
    return await this.reviewService.uploadImages(body?.images || [], auth);
  }

  // Create review
  @ApiTags("⭐ Reviews")
  @Post()
  async createReview(@Body() body: any, @Headers("authorization") auth?: string) {
    return await this.reviewService.createReview(body, auth);
  }

  // Get pending reviews (admin)
  @ApiTags("📋 Admin Reviews")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Get("admin/pending")
  async getPendingReviews(@Query("page") page?: string) {
    return await this.reviewService.getPendingReviews(parseInt(page || "1"));
  }

  // Approve review
  @ApiTags("📋 Admin Reviews")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Put("admin/:id/approve")
  async approveReview(@Param("id") id: string) {
    return await this.reviewService.approveReview(id);
  }

  // Reject review
  @ApiTags("📋 Admin Reviews")
  @ApiBearerAuth()
  @UseGuards(AdminGuard)  @Put("admin/:id/reject")
  async rejectReview(@Param("id") id: string) {
    return await this.reviewService.rejectReview(id);
  }

  // Update review
  @ApiTags("⭐ Reviews")
  @Put(":id")
  async updateReview(@Param("id") id: string, @Body() body: any, @Headers("authorization") auth?: string) {
    return await this.reviewService.updateReview(id, body, auth);
  }

  // Delete review
  @ApiTags("⭐ Reviews")
  @Delete(":id")
  async deleteReview(@Param("id") id: string, @Headers("authorization") auth?: string) {
    return await this.reviewService.deleteReview(id, auth);
  }
}
