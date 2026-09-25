import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../auth/admin.guard";
import { SponsorshipService } from "./sponsorship.service";

/**
 * Admin-only. The storefront reads sponsorships through `GET /api/cms/sponsorships`,
 * which strips voucher codes and winners' phone numbers.
 *
 * Mounted under `admin/` so the admin app's proxy — which turns the HttpOnly
 * session cookie into a bearer token for anything beneath `/api/admin` — covers
 * it without any extra wiring.
 */
@ApiTags("🤝 Sponsorships")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller("admin/sponsorships")
export class SponsorshipController {
  constructor(private readonly sponsorshipService: SponsorshipService) {}

  // ==================== SPONSORSHIPS ====================

  @Get()
  list() {
    return this.sponsorshipService.listSponsorships();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.sponsorshipService.getSponsorship(id);
  }

  @Post()
  create(
    @Body()
    body: {
      partnerName: string;
      partnerHandle?: string;
      partnerUrl?: string;
      eventName: string;
      eventDate?: string;
      location?: string;
      headline?: string;
      blurb?: string;
      bannerImageUrl?: string;
      partnerLogoUrl?: string;
      isActive?: boolean;
      showWinners?: boolean;
      priority?: number;
      startsAt?: string;
      endsAt?: string;
    }
  ) {
    return this.sponsorshipService.createSponsorship(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.sponsorshipService.updateSponsorship(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.sponsorshipService.deleteSponsorship(id);
  }

  // ==================== VOUCHERS ====================

  @Post(":id/vouchers")
  createVoucher(
    @Param("id") id: string,
    @Body()
    body: {
      winnerName: string;
      winnerPhone?: string;
      position?: number;
      value: number;
      maxRedemptions?: number;
      expiresAt?: string;
      isActive?: boolean;
    }
  ) {
    return this.sponsorshipService.createVoucher(id, body);
  }

  @Put("vouchers/:voucherId")
  updateVoucher(@Param("voucherId") voucherId: string, @Body() body: any) {
    return this.sponsorshipService.updateVoucher(voucherId, body);
  }

  @Delete("vouchers/:voucherId")
  deleteVoucher(@Param("voucherId") voucherId: string) {
    return this.sponsorshipService.deleteVoucher(voucherId);
  }

  @Post("vouchers/:voucherId/adjust")
  adjustVoucher(@Param("voucherId") voucherId: string, @Body() body: { amount: number; note?: string }) {
    return this.sponsorshipService.adjustVoucher(voucherId, body);
  }
}
