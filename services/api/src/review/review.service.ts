import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private extractUserId(authHeader?: string): string {
    if (!authHeader) {
      throw new UnauthorizedException("Login required to submit a review");
    }
    try {
      const secret = process.env.JWT_SECRET || "dev-secret-key";
      const decoded = jwt.verify(authHeader.replace("Bearer ", ""), secret) as any;
      if (!decoded.userId) throw new Error("Missing userId");
      return decoded.userId;
    } catch {
      throw new UnauthorizedException("Invalid login session");
    }
  }

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
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
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
  async createReview(data: any, authHeader?: string) {
    const userId = this.extractUserId(authHeader);

    const productId = data.productId;
    if (!productId) {
      throw new BadRequestException("productId is required");
    }

    const rating = Number(data.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5");
    }

    const title = String(data.title || "").trim();
    const body = String(data.body || data.message || data.comment || "").trim();
    if (!title) throw new BadRequestException("Review title is required");
    if (!body) throw new BadRequestException("Review message is required");

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException("Product not found");
    }

    const mediaUrls: string[] = Array.isArray(data.mediaUrls)
      ? data.mediaUrls
      : Array.isArray(data.images)
        ? data.images
        : [];

    const existing = await this.prisma.review.findFirst({
      where: { productId, userId },
    });

    if (existing) {
      return await this.prisma.review.update({
        where: { id: existing.id },
        data: { rating, title, body, mediaUrls, status: "PENDING" },
        include: { user: { select: { name: true, image: true } } },
      });
    }

    return await this.prisma.review.create({
      data: {
        productId,
        userId,
        orderId: data.orderId || null,
        rating,
        title,
        body,
        mediaUrls,
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

  // Latest approved reviews for homepage
  async getLatestReviews(limit: number = 8) {
    const reviews = await this.prisma.review.findMany({
      where: { status: "APPROVED" },
      include: {
        user: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { data: reviews, total: reviews.length };
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
