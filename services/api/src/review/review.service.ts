import { Injectable, BadRequestException, UnauthorizedException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as jwt from "jsonwebtoken";
import { requireJwtSecret } from "../auth/jwt-secret";

const REVIEW_BUCKET = "product-images";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly storage: SupabaseClient | null;

  constructor(private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.storage = url && serviceKey ? createClient(url, serviceKey) : null;
  }

  async uploadImages(images: string[], authHeader?: string) {
    this.extractUserId(authHeader);

    if (!Array.isArray(images) || images.length === 0) {
      return { data: { urls: [] } };
    }
    if (images.length > MAX_IMAGES) {
      throw new BadRequestException(`You can upload at most ${MAX_IMAGES} images`);
    }
    if (!this.storage) {
      throw new BadRequestException("Image storage is not configured");
    }

    const urls: string[] = [];

    for (const image of images) {
      const match = /^data:([a-z/+-]+);base64,(.+)$/i.exec(image || "");
      if (!match) {
        throw new BadRequestException("Images must be base64 data URLs");
      }

      const [, mimeType, base64] = match;
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
        throw new BadRequestException(`Unsupported image type: ${mimeType}`);
      }

      const buffer = Buffer.from(base64, "base64");
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new BadRequestException("Each image must be smaller than 5MB");
      }

      const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
      const objectPath = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

      const { data, error } = await this.storage.storage
        .from(REVIEW_BUCKET)
        .upload(objectPath, buffer, { contentType: mimeType, upsert: false });

      if (error) {
        this.logger.error(`Review image upload failed: ${error.message}`);
        throw new BadRequestException("Failed to upload review image");
      }

      const { data: pub } = this.storage.storage.from(REVIEW_BUCKET).getPublicUrl(data.path);
      urls.push(pub.publicUrl);
    }

    return { data: { urls } };
  }

  private extractUserId(authHeader?: string): string {
    if (!authHeader) {
      throw new UnauthorizedException("Login required to submit a review");
    }
    try {
      const secret = requireJwtSecret();
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
