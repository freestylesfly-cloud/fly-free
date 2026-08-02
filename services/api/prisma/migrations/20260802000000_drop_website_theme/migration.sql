-- Website themes are gone: brand colours, fonts, motion and hero copy are now
-- compile-time constants in apps/web/app/lib/design.ts. Hero artwork comes from
-- Product Themes (the Theme table), which is untouched.

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_websiteThemeId_fkey";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "websiteThemeId";

-- DropTable
DROP TABLE "WebsiteTheme";
