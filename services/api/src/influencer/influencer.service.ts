import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InfluencerService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all influencers
  async getAllInfluencers() {
    return await this.prisma.influencer.findMany({
      include: {
        products: {
          include: { images: { orderBy: { priority: "asc" } }, variants: { include: { inventory: true } }, category: true, theme: true }
        },
        referrals: true,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }]
    });
  }

  // Get active influencers (for frontend display)
  async getActiveInfluencers() {
    const influencers = await this.prisma.influencer.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isVisible: true },
          include: { images: { orderBy: { priority: "asc" } }, variants: { include: { inventory: true } }, category: true, theme: true }
        },
        referrals: true,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }]
    });
    const promoted = influencers.filter((influencer) => influencer.products.length > 0);
    return promoted;
  }

  async getHomepageFeaturedInfluencers() {
    const influencers = await this.getActiveInfluencers();
    return influencers.filter((influencer) => influencer.homepageFeatured);
  }

  // Get influencer by ID
  async getInfluencerById(id: string) {
    return await this.prisma.influencer.findUnique({
      where: { id },
      include: {
        products: {
          where: { isVisible: true },
          include: { images: { orderBy: { priority: "asc" } }, variants: { include: { inventory: true } }, category: true, theme: true }
        },
        referrals: true,
      },
    });
  }

  // Create influencer
  async createInfluencer(data: any) {
    return await this.prisma.influencer.create({
      data: {
        name: data.name,
        email: data.email,
        imageUrl: data.imageUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        xUrl: data.xUrl,
        youtubeUrl: data.youtubeUrl,
        socialHandle: data.socialHandle,
        followers: data.followers === undefined ? undefined : data.followers === null ? null : Number(data.followers),
        instagramFollowers: data.instagramFollowers === undefined ? undefined : data.instagramFollowers === null ? null : Number(data.instagramFollowers),
        facebookFollowers: data.facebookFollowers === undefined ? undefined : data.facebookFollowers === null ? null : Number(data.facebookFollowers),
        xFollowers: data.xFollowers === undefined ? undefined : data.xFollowers === null ? null : Number(data.xFollowers),
        youtubeFollowers: data.youtubeFollowers === undefined ? undefined : data.youtubeFollowers === null ? null : Number(data.youtubeFollowers),
        displayOrder: data.displayOrder === undefined ? 0 : Number(data.displayOrder),
        code: data.code || this.generateCode(),
        buyerDiscountPercent: data.buyerDiscountPercent || 10,
        commissionRate: data.commissionRate || 5.0,
        isActive: data.isActive !== false,
      },
      include: {
        products: true,
        referrals: true,
      },
    });
  }

  // Update influencer
  async updateInfluencer(id: string, data: any) {
    return await this.prisma.influencer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        imageUrl: data.imageUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        xUrl: data.xUrl,
        youtubeUrl: data.youtubeUrl,
        socialHandle: data.socialHandle,
        followers: data.followers === undefined ? undefined : Number(data.followers),
        instagramFollowers: data.instagramFollowers === undefined ? undefined : Number(data.instagramFollowers),
        facebookFollowers: data.facebookFollowers === undefined ? undefined : Number(data.facebookFollowers),
        xFollowers: data.xFollowers === undefined ? undefined : Number(data.xFollowers),
        youtubeFollowers: data.youtubeFollowers === undefined ? undefined : Number(data.youtubeFollowers),
        displayOrder: data.displayOrder === undefined ? undefined : Number(data.displayOrder),
        code: data.code,
        buyerDiscountPercent: data.buyerDiscountPercent,
        commissionRate: data.commissionRate,
        isActive: data.isActive,
      },
      include: {
        products: true,
        referrals: true,
      },
    });
  }

  // Delete influencer
  async deleteInfluencer(id: string) {
    return await this.prisma.influencer.delete({
      where: { id },
    });
  }

  // Get influencer stats
  async getInfluencerStats(id: string) {
    const influencer = await this.prisma.influencer.findUnique({
      where: { id },
      include: {
        referrals: true,
      },
    });

    if (!influencer) return null;

    const totalEarnings = influencer.referrals.reduce(
      (sum: number, ref: any) => sum + (ref.commissionAmount || 0),
      0
    );

    return {
      ...influencer,
      totalReferrals: influencer.referrals.length,
      totalEarnings,
      estimatedRevenue: totalEarnings,
    };
  }

  // Generate unique referral code
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
