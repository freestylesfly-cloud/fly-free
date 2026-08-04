/**
 * Sets (or resets) an admin password.
 *
 *   npm run admin:set-password -- admin@flyfree.com 'your-password'
 *
 * Admin login rejects any account whose passwordHash is NULL, so every admin
 * needs this run once.
 */
import * as dotenv from "dotenv";
import * as path from "node:path";

// Run outside Nest, so nothing has loaded the env files yet.
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npm run admin:set-password -- <email> <password>");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const normalized = email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });

  if (!admin) {
    const known = await prisma.adminUser.findMany({ select: { email: true } });
    console.error(`No admin found with email "${normalized}".`);
    console.error(`Known admin accounts: ${known.map((a) => a.email).join(", ") || "(none)"}`);
    process.exit(1);
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(password, 10) }
  });

  console.log(`Password set for ${admin.email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
