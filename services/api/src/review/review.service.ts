import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // Get reviews for a product
  async getProductReviews(productId: string, page: number = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          productId,
          status: "APPROVED",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      this.prisma.review.count({
        where: {
          productId,
          status: "APPROVED",
        },
      }),
    ]);

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return {
      reviews,
      total,
      avgRating,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Create review
  async createReview(productId: string, userId: string, data: any) {
    return await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        body: data.body || data.comment,
        mediaUrls: data.mediaUrls || [],
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }

  // Update review
  async updateReview(id: string, data: any) {
    return await this.prisma.review.update({
      where: { id },
      data: {
        rating: data.rating,
        title: data.title,
        body: data.body || data.comment,
        mediaUrls: data.mediaUrls,
      },
    });
  }

  // Delete review
  async deleteReview(id: string) {
    return await this.prisma.review.delete({
      where: { id },
    });
  }

  // Get pending reviews (admin)
  async getPendingReviews(page: number = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          status: "PENDING",
        },
        include: {
          user: true,
          product: true,
        },
        orderBy: { createdAt: "asc" },
        take: limit,
        skip,
      }),
      this.prisma.review.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return {
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Approve review
  async approveReview(id: string) {
    return await this.prisma.review.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  }

  // Reject review
  async rejectReview(id: string) {
    return await this.prisma.review.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  }
}
