/**
 * Demo sponsorship + prize vouchers, for looking at the UI before a real event.
 *
 * Deliberately NOT part of prisma/seed.ts, which is a production bootstrap and
 * must never carry demo content. This is a throwaway fixture: run it to populate
 * the screens, run it with --remove to take every row back out again.
 *
 *   node scripts/seed-sponsorship-demo.mjs            # create
 *   node scripts/seed-sponsorship-demo.mjs --remove   # delete
 *
 * The sponsorship is created ACTIVE so it renders on the storefront locally.
 * That is safe while the deployed API has no sponsorship route — but once this
 * feature ships, an active demo row WILL appear on the real homepage. Remove it
 * before deploying, or untick "Show this sponsorship on the storefront" in Admin.
 *
 * Vouchers are created in four different states so every UI branch is visible
 * without having to place an order: fresh, last-use, expired, and used up.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PARTNER = "Dibrugarh Korean Club";
const remove = process.argv.includes("--remove");

// Unsplash, not Supabase: these are placeholders for a real event's artwork, and
// storageImage() passes non-Supabase URLs through untouched.
const BANNER = "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&h=900&fit=crop&q=70";
const LOGO = "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&h=600&fit=crop&q=70";

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function main() {
  const existing = await prisma.sponsorship.findFirst({ where: { partnerName: PARTNER } });

  if (remove) {
    if (!existing) {
      console.log("Nothing to remove.");
      return;
    }
    const spent = await prisma.voucherRedemption.count({
      where: { voucher: { sponsorshipId: existing.id }, kind: "REDEEM" },
    });
    if (spent > 0) {
      console.log(`Refusing to remove: ${spent} voucher redemption(s) are attached to real orders.`);
      console.log("Untick 'Show this sponsorship on the storefront' in Admin instead.");
      return;
    }
    await prisma.sponsorship.delete({ where: { id: existing.id } });
    console.log(`Removed the ${PARTNER} demo sponsorship and its vouchers.`);
    return;
  }

  if (existing) {
    console.log(`A ${PARTNER} sponsorship already exists (${existing.id}). Run with --remove first to recreate it.`);
    return;
  }

  const sponsorship = await prisma.sponsorship.create({
    data: {
      partnerName: PARTNER,
      partnerHandle: "@dibrugarhkorean.club",
      partnerUrl: "https://www.instagram.com/dibrugarhkorean.club/",
      eventName: "Korean Culture Fest 2026",
      eventDate: daysFromNow(14),
      location: "Dibrugarh, Assam",
      headline: "Fly Free x Dibrugarh Korean Club",
      blurb:
        "We are backing the Korean Culture Fest with prize tees for the winners. Learning, culture, community — and something good to wear.",
      bannerImageUrl: BANNER,
      partnerLogoUrl: LOGO,
      isActive: true,
      showWinners: true,
      winnersUntil: daysFromNow(30),
      priority: 0,
      vouchers: {
        create: [
          {
            // Fresh: the ordinary case, full balance and both uses available.
            code: "DEMO01-FRESH1",
            winnerName: "Ananya Gogoi",
            winnerPhone: "9864000001",
            position: 1,
            value: 999,
            balance: 999,
            maxRedemptions: 2,
            expiresAt: daysFromNow(30),
          },
          {
            // Part-spent and down to its last use, so checkout shows the warning
            // that the leftover balance cannot be carried over.
            code: "DEMO02-LASTUS",
            winnerName: "Rohit Saikia",
            winnerPhone: "9864000002",
            position: 2,
            value: 999,
            balance: 640,
            maxRedemptions: 2,
            redemptionsUsed: 1,
            expiresAt: daysFromNow(30),
          },
          {
            code: "DEMO03-EXPIRD",
            winnerName: "Priya Baruah",
            winnerPhone: "9864000003",
            position: 3,
            value: 599,
            balance: 599,
            expiresAt: daysFromNow(-2),
          },
          {
            code: "DEMO04-USEDUP",
            winnerName: "Kabir Hazarika",
            winnerPhone: "9864000004",
            position: 4,
            value: 499,
            balance: 0,
            redemptionsUsed: 2,
            expiresAt: daysFromNow(30),
          },
        ],
      },
    },
    include: { vouchers: { orderBy: { position: "asc" } } },
  });

  // Explains the second voucher's reduced balance without inventing a fake order.
  const lastUse = sponsorship.vouchers.find((v) => v.code === "DEMO02-LASTUS");
  await prisma.voucherRedemption.create({
    data: {
      voucherId: lastUse.id,
      // Negative: amount is the signed change to the balance.
      amount: -359,
      balanceAfter: 640,
      kind: "ADJUSTMENT",
      note: "Demo data only — no real purchase behind this",
    },
  });

  console.log(`Created "${sponsorship.partnerName}" — ${sponsorship.eventName}\n`);
  for (const v of sponsorship.vouchers) {
    const state =
      v.balance === 0 || v.redemptionsUsed >= v.maxRedemptions
        ? "used up"
        : v.expiresAt && v.expiresAt < new Date()
          ? "expired"
          : v.maxRedemptions - v.redemptionsUsed === 1
            ? "LAST USE — shows the forfeit warning"
            : "fresh";
    console.log(`  ${v.code}  Rs ${String(v.balance).padStart(4)} of ${String(v.value).padEnd(4)}  ${v.redemptionsUsed}/${v.maxRedemptions} used  ${v.winnerName} — ${state}`);
  }
  console.log("\nTry DEMO01-FRESH1 and DEMO02-LASTUS at checkout.");
}

try {
  await main();
} catch (error) {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
