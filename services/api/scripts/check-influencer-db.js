require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is missing");
  const url = new URL(raw);
  url.hostname = "52.76.128.157";
  url.searchParams.delete("channel_binding");
  url.searchParams.set("options", "endpoint=ep-empty-haze-azhxvveb-pooler");
  return url.toString();
}

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl() } } });
  try {
    if (process.argv.includes("--apply")) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Influencer"
        ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "instagramFollowers" INTEGER,
        ADD COLUMN IF NOT EXISTS "facebookFollowers" INTEGER,
        ADD COLUMN IF NOT EXISTS "xFollowers" INTEGER,
        ADD COLUMN IF NOT EXISTS "youtubeFollowers" INTEGER,
        ADD COLUMN IF NOT EXISTS "homepageFeatured" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Influencer_isActive_displayOrder_idx" ON "Influencer"("isActive", "displayOrder")
      `);
      console.log("migration applied");
    }

    const columns = await prisma.$queryRawUnsafe(`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'Influencer'
        and column_name in ('instagramFollowers', 'facebookFollowers', 'xFollowers', 'youtubeFollowers', 'homepageFeatured', 'displayOrder', 'youtubeUrl')
      order by column_name
    `);
    console.log("columns", columns.map((row) => row.column_name).join(","));

    const count = await prisma.influencer.count();
    console.log("influencer count", count);

    await prisma.influencer.findMany({
      where: { isActive: true },
      take: 1,
      include: {
        products: {
          where: { isVisible: true },
          include: { images: { orderBy: { priority: "asc" } }, variants: { include: { inventory: true } }, category: true, theme: true }
        },
        referrals: true,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }]
    });
    console.log("influencer query ok");
  } catch (error) {
    console.log("db check error", error.code || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
