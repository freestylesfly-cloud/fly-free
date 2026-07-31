import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { createClient } from "@supabase/supabase-js";

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private supabase: any;

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
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

  // Upload review images to Supabase
  async uploadImages(files: Express.Multer.File[]) {
    if (!this.supabase) {
      this.logger.warn("Supabase not configured, returning empty URLs");
      return { data: { urls: [] } };
    }

    const urls: string[] = [];
    const bucket = "products"; // Use existing bucket

    for (const file of files) {
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `reviews/${timestamp}-${random}-${file.originalname}`;

        // Upload file to Supabase
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          this.logger.warn(`Failed to upload ${file.originalname}: ${error.message}`);
          continue;
        }

        // Get public URL
        const { data: publicUrl } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        if (publicUrl?.publicUrl) {
          urls.push(publicUrl.publicUrl);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        this.logger.warn(`Error uploading file: ${message}`);
        continue;
      }
    }

    return {
      data: { urls },
      message: `Uploaded ${urls.length} of ${files.length} images`
    };
  }
}
