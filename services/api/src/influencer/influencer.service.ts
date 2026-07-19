import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InfluencerService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all influencers
  async getAllInfluencers() {
    return await this.prisma.influencer.findMany({
      include: {
        referrals: true,
      },
    });
  }

  // Get active influencers (for frontend display)
  async getActiveInfluencers() {
    return await this.prisma.influencer.findMany({
      where: { isActive: true },
      include: {
        referrals: true,
      },
    });
  }

  // Get influencer by ID
  async getInfluencerById(id: string) {
    return await this.prisma.influencer.findUnique({
      where: { id },
      include: {
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
        socialHandle: data.socialHandle,
        code: data.code || this.generateCode(),
        buyerDiscountPercent: data.buyerDiscountPercent || 10,
        commissionRate: data.commissionRate || 5.0,
        isActive: data.isActive !== false,
      },
      include: {
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
        socialHandle: data.socialHandle,
        code: data.code,
        buyerDiscountPercent: data.buyerDiscountPercent,
        commissionRate: data.commissionRate,
        isActive: data.isActive,
      },
      include: {
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
      (sum, ref) => sum + (ref.commissionAmount || 0),
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
