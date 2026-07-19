import { Controller, Get, Post, Put, Delete, Body, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ReviewService } from "./review.service";

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

  // Create review
  @ApiTags("⭐ Reviews")
  @Post()
  async createReview(@Body() body: any) {
    return await this.reviewService.createReview(body.productId, body.userId, body);
  }

  // Update review
  @ApiTags("⭐ Reviews")
  @Put(":id")
  async updateReview(@Param("id") id: string, @Body() body: any) {
    return await this.reviewService.updateReview(id, body);
  }

  // Delete review
  @ApiTags("⭐ Reviews")
  @Delete(":id")
  async deleteReview(@Param("id") id: string) {
    return await this.reviewService.deleteReview(id);
  }

  // Get pending reviews (admin)
  @ApiTags("📋 Admin Reviews")
  @Get("admin/pending")
  async getPendingReviews(@Query("page") page?: string) {
    return await this.reviewService.getPendingReviews(parseInt(page || "1"));
  }

  // Approve review
  @ApiTags("📋 Admin Reviews")
  @Put("admin/:id/approve")
  async approveReview(@Param("id") id: string) {
    return await this.reviewService.approveReview(id);
  }

  // Reject review
  @ApiTags("📋 Admin Reviews")
  @Put("admin/:id/reject")
  async rejectReview(@Param("id") id: string) {
    return await this.reviewService.rejectReview(id);
  }
}
