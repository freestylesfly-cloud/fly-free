/**
 * End-to-end test suite for sponsorship prize vouchers.
 *
 * There is no test framework in this repo, so this is a standalone script in the
 * same style as migrate-database.mjs: it seeds its own fixtures, exercises the
 * running API over HTTP, checks the database after each step, and deletes
 * everything it created.
 *
 * SAFETY — it refuses to run against the production database. Every row it
 * writes is prefixed `__test__` or uses a `TESTV-` voucher code, and teardown
 * removes them. It will not start unless TEST_DATABASE_URL is set to something
 * other than the DATABASE_URL the API normally uses.
 *
 * Usage, with the API running against the same test database:
 *
 *   # terminal 1
 *   cd services/api
 *   DATABASE_URL="$TEST_DATABASE_URL" node dist/main
 *
 *   # terminal 2
 *   cd services/api
 *   TEST_DATABASE_URL="postgres://...test-db..." npm run test:vouchers
 *
 * The Razorpay-paid leg stops at "order created for the right amount": actually
 * paying it needs a card typed into the Razorpay modal, which no script can do.
 * What is checked is that the gateway is asked for the post-voucher remainder
 * and that the credit is still untouched until that payment clears.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(HERE, "..");
const API = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "") + "/api";

/** Reads a key out of services/api/.env without pulling in dotenv. */
function envFile(name) {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(API_ROOT, file);
    if (!fs.existsSync(full)) continue;
    const line = fs.readFileSync(full, "utf8").split(/\r?\n/).find((l) => l.startsWith(name + "="));
    if (line) return line.slice(name.length + 1).trim().replace(/^"|"$/g, "");
  }
  return "";
}

const TEST_URL = process.env.TEST_DATABASE_URL || "";
const LIVE_URL = envFile("DATABASE_URL");

if (!TEST_URL) {
  console.error("TEST_DATABASE_URL is not set. Refusing to guess — it would be the production database.");
  process.exit(1);
}
if (sameDatabase(TEST_URL, LIVE_URL)) {
  console.error("TEST_DATABASE_URL points at the same database as DATABASE_URL. Refusing to run against production.");
  process.exit(1);
}

function sameDatabase(a, b) {
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.host === y.host && x.pathname === y.pathname;
  } catch {
    return false;
  }
}

const prisma = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
const SECRET = envFile("JWT_SECRET");
const results = [];
const created = { sponsorshipId: null, orderIds: [] };

function check(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function call(method, pathname, token, body) {
  const res = await fetch(API + pathname, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => null) };
}

const getVoucher = (code) => prisma.prizeVoucher.findUnique({ where: { code }, include: { redemptions: true } });

async function main() {
  // ---------- fixtures ----------
  const user = await prisma.user.findFirst({ where: { email: { not: null } }, select: { id: true, email: true } });
  const other = await prisma.user.findFirst({ where: { email: { not: null }, id: { not: user.id } }, select: { id: true, email: true } });
  const admin = await prisma.adminUser.findFirst({ select: { id: true, email: true } });
  if (!user || !other || !admin) throw new Error("Test database needs at least two users and one admin.");

  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
  const otherToken = jwt.sign({ userId: other.id, email: other.email }, SECRET, { expiresIn: "1h" });
  const adminToken = jwt.sign({ userId: admin.id, adminId: admin.id, email: admin.email, isAdmin: true, role: "Admin" }, SECRET, { expiresIn: "1h" });

  const variant = await prisma.productVariant.findFirst({
    where: { product: { isVisible: true }, inventory: { stock: { gte: 10 } } },
    include: { product: { select: { id: true, name: true, price: true } } }
  });
  if (!variant) throw new Error("Test database needs a visible product with stock.");

  const unit = Math.round(Number(variant.price ?? variant.product.price) / 100);
  const { deliveryFee, freeDeliveryAbove } = await deliverySettings();
  const totalFor = (qty) => (unit * qty >= freeDeliveryAbove ? unit * qty : unit * qty + deliveryFee);
  const cart = (qty) => [{ productId: variant.product.id, variantId: variant.id, quantity: qty }];
  const address = { name: "Voucher Test", phone: "9999900000", street: "1 Test Lane", city: "Dibrugarh", state: "Assam", pincode: "786001" };

  console.log(`\nFixture: ${variant.product.name} @ Rs ${unit}, delivery Rs ${deliveryFee} under Rs ${freeDeliveryAbove}\n`);

  // Sized so one voucher more than covers a single unit and another falls short.
  const fullCover = totalFor(1) + 200;
  const partial = Math.max(totalFor(1) - 150, 50);

  const sponsorship = await prisma.sponsorship.create({
    data: {
      partnerName: "__test__ Partner",
      eventName: "__test__ Event",
      isActive: true,
      showWinners: false,
      vouchers: {
        create: [
          { code: "TESTV1-AAAAAA", winnerName: "__test__ Winner One", position: 1, value: fullCover, balance: fullCover },
          { code: "TESTV2-BBBBBB", winnerName: "__test__ Winner Two", position: 2, value: partial, balance: partial },
          { code: "TESTV3-CCCCCC", winnerName: "__test__ Expired", value: 500, balance: 500, expiresAt: new Date(Date.now() - 86_400_000) },
          { code: "TESTV4-DDDDDD", winnerName: "__test__ Used Up", value: 500, balance: 500, redemptionsUsed: 2 }
        ]
      }
    }
  });
  created.sponsorshipId = sponsorship.id;

  // ---------- validation ----------
  console.log("Voucher validation");
  let r = await call("GET", "/ecommerce/voucher/TESTV3-CCCCCC", token);
  check("expired voucher is rejected", r.body?.valid === false && /expired/i.test(r.body?.message), r.body?.message);

  r = await call("GET", "/ecommerce/voucher/TESTV4-DDDDDD", token);
  check("voucher with no uses left is rejected", r.body?.valid === false && /full 2 time/i.test(r.body?.message), r.body?.message);

  r = await call("GET", "/ecommerce/voucher/NOPE00-000000", token);
  check("unknown code is rejected", r.body?.valid === false, r.body?.message);

  r = await call("GET", "/ecommerce/voucher/TESTV1-AAAAAA");
  check("anonymous lookup is refused", r.body?.valid === false && /sign in/i.test(r.body?.message), r.body?.message);

  r = await call("GET", "/ecommerce/voucher/TESTV1-AAAAAA", token);
  check("valid voucher reports balance and uses left", r.body?.valid === true && r.body.balance === fullCover && r.body.usesLeft === 2, `Rs ${r.body?.balance}, ${r.body?.usesLeft} uses`);

  // ---------- zero-payment order ----------
  console.log("\nVoucher covers the whole order");
  const expected = totalFor(1);
  r = await call("POST", "/commerce/checkout", token, { items: cart(1), address, voucherCode: "TESTV1-AAAAAA" });
  const checkout = r.body?.data;
  check("checkout reports nothing to pay", checkout?.mode === "VOUCHER_FULL" && checkout?.amount === 0, `mode=${checkout?.mode} due=Rs ${checkout?.amount}`);
  check("delivery is charged on the real cart value", checkout?.total === expected, `total=Rs ${checkout?.total}, expected Rs ${expected}`);
  check("no gateway key is issued", checkout?.razorpayKeyId === null);

  r = await call("POST", "/commerce/checkout/voucher-complete", token, { quoteToken: checkout.quoteToken, reference: checkout.razorpayOrderId });
  const order = r.body?.data;
  if (order?.id) created.orderIds.push(order.id);
  check("order is placed", r.ok, `${order?.orderNumber}`);
  check("order total is the real value and cash captured is zero", order?.total === expected && order?.payment?.amount === 0 && order?.payment?.provider === "VOUCHER");

  let v = await getVoucher("TESTV1-AAAAAA");
  check("balance and use count move", v.balance === fullCover - expected && v.redemptionsUsed === 1, `Rs ${fullCover} -> Rs ${v.balance}, ${v.redemptionsUsed}/2 used`);
  check("voucher is pinned to the buyer", v.claimedByUserId === user.id);
  const redeem = v.redemptions.find((x) => x.kind === "REDEEM");
  check("REDEEM ledger row is written as a negative change", !!redeem && redeem.amount === -expected && redeem.balanceAfter === fullCover - expected);

  // ---------- replay ----------
  console.log("\nReplay and abuse");
  r = await call("POST", "/commerce/checkout/voucher-complete", token, { quoteToken: checkout.quoteToken, reference: checkout.razorpayOrderId });
  const again = await getVoucher("TESTV1-AAAAAA");
  check("replaying the completion returns the same order", r.body?.data?.id === order.id);
  check("replaying does not spend the balance twice", again.balance === v.balance && again.redemptionsUsed === 1, `Rs ${again.balance}, ${again.redemptionsUsed} used`);

  r = await call("GET", "/ecommerce/voucher/TESTV1-AAAAAA", otherToken);
  check("a claimed voucher is blocked on another account", r.body?.valid === false && /another account/i.test(r.body?.message), r.body?.message);

  // ---------- partial cover ----------
  console.log("\nVoucher covers part of the order");
  r = await call("POST", "/commerce/checkout", token, { items: cart(2), address, voucherCode: "TESTV2-BBBBBB" });
  const partialCheckout = r.body?.data;
  const total2 = totalFor(2);
  check("gateway is charged only the remainder", partialCheckout?.mode === "RAZORPAY" && partialCheckout?.amount === total2 - partial, `total Rs ${partialCheckout?.total}, voucher Rs ${partialCheckout?.voucherApplied}, due Rs ${partialCheckout?.amount}`);
  check("credit is untouched until the payment clears", (await getVoucher("TESTV2-BBBBBB")).balance === partial, `still Rs ${partial}`);
  check("test-mode gateway key is in use", String(partialCheckout?.razorpayKeyId || "").startsWith("rzp_test_"), partialCheckout?.razorpayKeyId);

  const coupon = await prisma.coupon.findFirst({ where: { isActive: true, discountPercent: { not: null } } });
  if (coupon) {
    r = await call("POST", "/commerce/checkout", token, { items: cart(1), address, voucherCode: "TESTV2-BBBBBB", couponCode: coupon.code });
    check("a voucher overrides a coupon sent with it", r.body?.data?.total === expected && r.body?.data?.voucherApplied > 0, `no discount applied, total Rs ${r.body?.data?.total}`);
  }

  // ---------- cancellation ----------
  console.log("\nCancellation returns the credit");
  r = await call("PUT", `/admin/orders/${order.id}/status`, adminToken, { status: "CANCELLED", note: "__test__" });
  v = await getVoucher("TESTV1-AAAAAA");
  check("cancelling restores balance and the use", r.ok && v.balance === fullCover && v.redemptionsUsed === 0, `Rs ${v.balance}, ${v.redemptionsUsed} used`);
  check("a REVERSAL row records it as a positive change", v.redemptions.some((x) => x.kind === "REVERSAL" && x.amount > 0));

  await call("PUT", `/admin/orders/${order.id}/status`, adminToken, { status: "REFUNDED", note: "__test__" });
  v = await getVoucher("TESTV1-AAAAAA");
  check("a second cancellation does not credit twice", v.balance === fullCover && v.redemptions.filter((x) => x.kind === "REVERSAL").length === 1, `Rs ${v.balance}, ${v.redemptions.filter((x) => x.kind === "REVERSAL").length} reversal(s)`);

  // ---------- public exposure ----------
  console.log("\nPublic storefront payload");
  let text = await (await fetch(`${API}/cms/sponsorships`)).text();
  let mine = JSON.parse(text).find((s) => s.id === sponsorship.id);
  check("winners are hidden until revealed", Array.isArray(mine?.winners) && mine.winners.length === 0);

  // Through the admin API, so the write clears the public response cache.
  await call("PUT", `/admin/sponsorships/${sponsorship.id}`, adminToken, { showWinners: true });
  text = await (await fetch(`${API}/cms/sponsorships`)).text();
  mine = JSON.parse(text).find((s) => s.id === sponsorship.id);
  check("revealed winners carry name and position only", mine?.winners?.length === 4 && mine.winners[0].position === 1 && mine.winners[0].name.includes("Winner One"));
  check("no voucher code or phone number is ever public", !/TESTV\d|winnerPhone|"code"/i.test(text));
}

async function deliverySettings() {
  const row = await prisma.appSetting.findUnique({ where: { key: "admin_settings" } });
  const value = row?.value || {};
  return { deliveryFee: Number(value.deliveryFee ?? 60), freeDeliveryAbove: Number(value.freeDeliveryAbove ?? 1000) };
}

/** Removes every row the run created, newest dependency first. */
async function teardown() {
  for (const orderId of created.orderIds) {
    await prisma.voucherRedemption.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  }
  if (created.sponsorshipId) {
    // Vouchers and their remaining ledger rows cascade with the sponsorship.
    await prisma.sponsorship.delete({ where: { id: created.sponsorshipId } }).catch(() => {});
  }
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  console.error("\nHARNESS ERROR:", error.message);
  exitCode = 2;
} finally {
  await teardown();
  await prisma.$disconnect();
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("Failed:");
  failed.forEach((f) => console.log("  - " + f.name));
}
process.exit(exitCode || (failed.length ? 1 : 0));
