import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomInt } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Sponsorships and the prize vouchers issued to event winners.
 *
 * A voucher is store credit, not a discount: it carries a rupee balance that is
 * spent down across orders. Everything here is in WHOLE RUPEES so it lines up
 * with Order.total — the catalog stores paise, but nothing downstream of
 * priceCheckout does.
 *
 * Redeeming happens in CommerceService, inside the transaction that writes the
 * order. This service only issues, lists and manually adjusts.
 */
@Injectable()
export class SponsorshipService {
  private readonly logger = new Logger(SponsorshipService.name);

  /** No O/0/I/1 — these codes get read off a screen and typed by hand. */
  private static readonly CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  constructor(private readonly prisma: PrismaService) {}

  // ==================== SPONSORSHIPS ====================

  /**
   * The admin list. Returns per-sponsorship totals, not the vouchers themselves.
   *
   * Nothing here is ever deleted, so loading every voucher and every redemption
   * for every sponsorship would grow without limit for a screen that only prints
   * three numbers per row. The totals come from one grouped aggregate; the full
   * detail is loaded by {@link getSponsorship} for the one being opened.
   */
  async listSponsorships() {
    const sponsorships = await this.prisma.sponsorship.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    if (sponsorships.length === 0) return { data: [], total: 0 };

    const totals = await this.prisma.prizeVoucher.groupBy({
      by: ["sponsorshipId"],
      where: { sponsorshipId: { in: sponsorships.map((s) => s.id) } },
      _count: { _all: true },
      _sum: { value: true, balance: true },
    });

    const bySponsorship = new Map(totals.map((row) => [row.sponsorshipId, row]));

    return {
      data: sponsorships.map((sponsorship) => {
        const row = bySponsorship.get(sponsorship.id);
        return {
          ...sponsorship,
          voucherCount: row?._count._all ?? 0,
          totalIssued: row?._sum.value ?? 0,
          totalRemaining: row?._sum.balance ?? 0,
        };
      }),
      total: sponsorships.length,
    };
  }

  async getSponsorship(id: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id },
      include: {
        vouchers: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          include: { redemptions: this.redemptionInclude() },
        },
      },
    });
    if (!sponsorship) throw new NotFoundException("Sponsorship not found");
    return { data: sponsorship };
  }

  async createSponsorship(data: any) {
    const normalized = this.normalizeSponsorshipData(data);
    if (!normalized.partnerName) throw new BadRequestException("Partner name is required");
    if (!normalized.eventName) throw new BadRequestException("Event name is required");

    const sponsorship = await this.prisma.sponsorship.create({ data: normalized });
    this.logger.log(`Created sponsorship: ${sponsorship.id} (${sponsorship.partnerName})`);
    return { data: sponsorship, message: "Sponsorship created successfully" };
  }

  async updateSponsorship(id: string, data: any) {
    await this.getSponsorship(id);
    const sponsorship = await this.prisma.sponsorship.update({
      where: { id },
      data: this.normalizeSponsorshipData(data, true),
    });
    this.logger.log(`Updated sponsorship: ${id}`);
    return { data: sponsorship, message: "Sponsorship updated successfully" };
  }

  async deleteSponsorship(id: string) {
    // Vouchers cascade, and their redemptions with them. Refuse once any credit
    // has actually been spent, because those rows are an order's audit trail.
    const spent = await this.prisma.voucherRedemption.count({
      where: { voucher: { sponsorshipId: id }, kind: "REDEEM" },
    });
    if (spent > 0) {
      throw new BadRequestException(
        "This sponsorship has vouchers that were already spent. Deactivate it instead of deleting it, so the order history stays intact."
      );
    }

    await this.prisma.sponsorship.delete({ where: { id } });
    this.logger.log(`Deleted sponsorship: ${id}`);
    return { message: "Sponsorship deleted successfully" };
  }

  // ==================== VOUCHERS ====================

  async createVoucher(sponsorshipId: string, data: any) {
    await this.getSponsorship(sponsorshipId);

    const winnerName = String(data.winnerName || "").trim();
    if (!winnerName) throw new BadRequestException("Winner name is required");

    const value = Number(data.value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException("Voucher value must be an amount in rupees greater than zero");
    }

    const maxRedemptions = Number(data.maxRedemptions);

    const voucher = await this.prisma.prizeVoucher.create({
      data: {
        sponsorshipId,
        code: await this.generateUniqueCode(),
        winnerName,
        winnerPhone: String(data.winnerPhone || "").trim() || null,
        position: data.position ? Number(data.position) : null,
        value: Math.round(value),
        // A new voucher starts with its full value available.
        balance: Math.round(value),
        maxRedemptions: Number.isFinite(maxRedemptions) && maxRedemptions > 0 ? Math.round(maxRedemptions) : 2,
        // Prizes get a deadline whether or not the admin sets one. An open-ended
        // voucher is a liability that sits on the books for years and keeps
        // matching every lookup; a month is long enough to claim a t-shirt.
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : this.defaultExpiry(),
        isActive: data.isActive !== false,
        // Default on: a prize belongs to the winner it was issued to.
        lockToFirstUser: data.lockToFirstUser !== false,
        winnerImageUrl: String(data.winnerImageUrl || "").trim() || null,
      },
    });

    this.logger.log(`Issued voucher ${voucher.id} worth Rs ${voucher.value} on sponsorship ${sponsorshipId}`);
    return { data: voucher, message: "Voucher created successfully" };
  }

  /**
   * Edits the winner's details and the voucher's limits.
   *
   * The code is never reissued — it has already been sent to the winner. The
   * balance is only moved through {@link adjustVoucher}, so an edit here cannot
   * silently wipe out credit that was already spent.
   */
  async updateVoucher(id: string, data: any) {
    const existing = await this.prisma.prizeVoucher.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Voucher not found");

    const maxRedemptions = data.maxRedemptions === undefined ? undefined : Number(data.maxRedemptions);
    if (maxRedemptions !== undefined && (!Number.isFinite(maxRedemptions) || maxRedemptions < existing.redemptionsUsed)) {
      throw new BadRequestException(
        `This voucher has already been used ${existing.redemptionsUsed} time(s), so the limit cannot be set below that.`
      );
    }

    const voucher = await this.prisma.prizeVoucher.update({
      where: { id },
      data: {
        ...(data.winnerName !== undefined && { winnerName: String(data.winnerName).trim() }),
        ...(data.winnerPhone !== undefined && { winnerPhone: String(data.winnerPhone || "").trim() || null }),
        ...(data.position !== undefined && { position: data.position ? Number(data.position) : null }),
        ...(maxRedemptions !== undefined && { maxRedemptions: Math.round(maxRedemptions) }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive !== false }),
        ...(data.lockToFirstUser !== undefined && { lockToFirstUser: data.lockToFirstUser !== false }),
        ...(data.winnerImageUrl !== undefined && { winnerImageUrl: String(data.winnerImageUrl || "").trim() || null }),
      },
    });

    this.logger.log(`Updated voucher: ${id}`);
    return { data: voucher, message: "Voucher updated successfully" };
  }

  async deleteVoucher(id: string) {
    const spent = await this.prisma.voucherRedemption.count({ where: { voucherId: id, kind: "REDEEM" } });
    if (spent > 0) {
      throw new BadRequestException(
        "This voucher has already been spent on an order. Deactivate it instead of deleting it."
      );
    }

    await this.prisma.prizeVoucher.delete({ where: { id } });
    this.logger.log(`Deleted voucher: ${id}`);
    return { message: "Voucher deleted successfully" };
  }

  /**
   * Moves the balance by hand — topping a winner up, or clawing credit back.
   *
   * Writes an ADJUSTMENT row so the ledger still explains every rupee. Unlike a
   * redemption it has no order, so the (voucherId, orderId, kind) unique index
   * does not apply and repeated adjustments are all recorded.
   */
  async adjustVoucher(id: string, data: { amount: number; note?: string }) {
    const amount = Math.round(Number(data.amount));
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException("Enter an amount in rupees to add or subtract");
    }

    const voucher = await this.prisma.prizeVoucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException("Voucher not found");

    const balanceAfter = voucher.balance + amount;
    if (balanceAfter < 0) {
      throw new BadRequestException(`That would take the balance below zero — only Rs ${voucher.balance} is left.`);
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const next = await tx.prizeVoucher.update({
        where: { id },
        data: { balance: balanceAfter },
      });
      await tx.voucherRedemption.create({
        data: {
          voucherId: id,
          amount,
          balanceAfter,
          kind: "ADJUSTMENT",
          note: String(data.note || "").trim() || null,
        },
      });
      return next;
    });

    this.logger.log(`Adjusted voucher ${id} by Rs ${amount} to Rs ${balanceAfter}`);
    return { data: updated, message: "Balance updated" };
  }

  // ==================== PUBLIC ====================

  /**
   * The sponsorships the storefront banner shows right now.
   *
   * Columns are selected explicitly rather than included, so a voucher code or a
   * winner's phone number cannot reach a public response by being added to the
   * model later. Winners appear only once the event is over and showWinners is on.
   */
  /** Never show more than this many sponsorships, or winners within one. */
  private static readonly PUBLIC_LIMIT = 6;
  private static readonly WINNERS_LIMIT = 12;

  async getActiveSponsorships() {
    const now = new Date();

    // The whole filter runs in Postgres against the (isActive, startsAt, endsAt,
    // priority) index, and the result is capped. Expired sponsorships are never
    // deleted, but they are never read either — they stop matching the window.
    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: SponsorshipService.PUBLIC_LIMIT,
      select: {
        id: true,
        partnerName: true,
        partnerHandle: true,
        partnerUrl: true,
        eventName: true,
        eventDate: true,
        location: true,
        headline: true,
        blurb: true,
        bannerImageUrl: true,
        partnerLogoUrl: true,
        showWinners: true,
        winnersUntil: true,
      },
    });

    if (sponsorships.length === 0) return [];

    // A winners list retires on its own date. Working out which sponsorships are
    // still revealing BEFORE going to the voucher table means the common case —
    // a banner running ahead of its event — reads no vouchers at all, instead of
    // loading every winner just to discard them.
    const revealing = sponsorships.filter(
      (s) => s.showWinners && (!s.winnersUntil || s.winnersUntil.getTime() >= now.getTime())
    );

    const winnersBySponsorship = new Map<
      string,
      Array<{ id: string; name: string; position: number | null; prizeValue: number; imageUrl: string | null }>
    >();

    if (revealing.length > 0) {
      const winners = await this.prisma.prizeVoucher.findMany({
        where: { sponsorshipId: { in: revealing.map((s) => s.id) } },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: SponsorshipService.WINNERS_LIMIT * revealing.length,
        // `value` rides along on the query already being made — the prize total
        // is what makes the announcement worth reading.
        select: { id: true, sponsorshipId: true, winnerName: true, position: true, value: true, winnerImageUrl: true },
      });

      for (const winner of winners) {
        const list = winnersBySponsorship.get(winner.sponsorshipId) || [];
        if (list.length >= SponsorshipService.WINNERS_LIMIT) continue;
        list.push({
          id: winner.id,
          name: winner.winnerName,
          position: winner.position,
          prizeValue: winner.value,
          imageUrl: winner.winnerImageUrl,
        });
        winnersBySponsorship.set(winner.sponsorshipId, list);
      }
    }

    return sponsorships.map(({ showWinners, winnersUntil, ...sponsorship }) => {
      const winners = winnersBySponsorship.get(sponsorship.id) || [];
      return {
        ...sponsorship,
        winners,
        prizeTotal: winners.reduce((sum, w) => sum + w.prizeValue, 0),
      };
    });
  }

  /**
   * One sponsorship for its public details page.
   *
   * Same rules as the list: it must be live right now, and the columns are
   * selected explicitly so a code or a phone number cannot slip into a public
   * response. Winners carry the prize value here — it is a prize announcement,
   * so what was won is the point — but never the code that claims it.
   */
  async getPublicSponsorship(id: string) {
    const now = new Date();
    const sponsorship = await this.prisma.sponsorship.findFirst({
      where: {
        id,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        partnerName: true,
        partnerHandle: true,
        partnerUrl: true,
        eventName: true,
        eventDate: true,
        location: true,
        headline: true,
        blurb: true,
        bannerImageUrl: true,
        partnerLogoUrl: true,
        showWinners: true,
        winnersUntil: true,
      },
    });

    if (!sponsorship) throw new NotFoundException("Sponsorship not found");

    const revealing =
      sponsorship.showWinners &&
      (!sponsorship.winnersUntil || sponsorship.winnersUntil.getTime() >= now.getTime());

    const winners = revealing
      ? await this.prisma.prizeVoucher.findMany({
          where: { sponsorshipId: id },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          take: SponsorshipService.WINNERS_LIMIT,
          select: { id: true, winnerName: true, position: true, value: true, winnerImageUrl: true },
        })
      : [];

    const { showWinners, winnersUntil, ...rest } = sponsorship;

    return {
      ...rest,
      winners: winners.map((w) => ({
        id: w.id,
        name: w.winnerName,
        position: w.position,
        prizeValue: w.value,
        imageUrl: w.winnerImageUrl,
      })),
      // Headline figures for the "what we are giving" panel.
      prizeCount: winners.length,
      prizeTotal: winners.reduce((sum, w) => sum + w.value, 0),
    };
  }

  // ==================== HELPERS ====================

  /**
   * A 10-character code in two hyphenated blocks, e.g. FF7K2M-9QBX4T.
   *
   * Retried against the unique index rather than trusted blindly: 32^10 makes a
   * collision vanishingly unlikely, but a duplicate here would hand two winners
   * the same prize.
   */
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const raw = Array.from({ length: 12 }, () =>
        SponsorshipService.CODE_ALPHABET[randomInt(SponsorshipService.CODE_ALPHABET.length)]
      ).join("");
      const code = `${raw.slice(0, 6)}-${raw.slice(6)}`;
      const clash = await this.prisma.prizeVoucher.findUnique({ where: { code }, select: { id: true } });
      if (!clash) return code;
    }
    throw new BadRequestException("Could not generate a unique voucher code. Please try again.");
  }

  /** Prize vouchers expire a month after they are issued unless told otherwise. */
  static readonly DEFAULT_VALID_DAYS = 30;

  private defaultExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + SponsorshipService.DEFAULT_VALID_DAYS);
    return expiry;
  }

  private redemptionInclude() {
    return {
      orderBy: { createdAt: "desc" as const },
      // A voucher can only be spent a handful of times, but adjustments and
      // reversals are unbounded — cap what the detail screen pulls back.
      take: 20,
      include: {
        order: { select: { id: true, orderNumber: true, total: true, status: true, createdAt: true } },
        // Who spent the credit. Null on an admin adjustment, which belongs to no
        // customer — the admin screen labels that case rather than showing blank.
        user: { select: { id: true, name: true, email: true } },
      },
    };
  }

  private normalizeSponsorshipData(data: any, partial = false) {
    const normalized: any = {};
    const set = (key: string, value: any) => {
      if (!partial || value !== undefined) normalized[key] = value;
    };
    const text = (value: any) => (value === undefined ? undefined : String(value || "").trim() || null);
    const date = (value: any) => (value ? new Date(value) : value === null || value === "" ? null : undefined);

    set("partnerName", data.partnerName === undefined ? undefined : String(data.partnerName || "").trim());
    set("eventName", data.eventName === undefined ? undefined : String(data.eventName || "").trim());
    set("partnerHandle", text(data.partnerHandle));
    set("partnerUrl", text(data.partnerUrl));
    set("location", text(data.location));
    set("headline", text(data.headline));
    set("blurb", text(data.blurb));
    set("bannerImageUrl", text(data.bannerImageUrl));
    set("partnerLogoUrl", text(data.partnerLogoUrl));
    set("eventDate", date(data.eventDate));
    set("startsAt", date(data.startsAt));
    set("endsAt", date(data.endsAt));
    set("priority", data.priority === undefined ? undefined : Number(data.priority) || 0);
    set("isActive", data.isActive === undefined ? undefined : data.isActive === true);
    set("showWinners", data.showWinners === undefined ? undefined : data.showWinners === true);
    set("winnersUntil", date(data.winnersUntil));

    // Revealing winners without saying for how long would leave last year's
    // result on the homepage indefinitely, so give it the same month.
    if (normalized.showWinners === true && data.winnersUntil === undefined) {
      normalized.winnersUntil = this.defaultExpiry();
    }

    return normalized;
  }
}
