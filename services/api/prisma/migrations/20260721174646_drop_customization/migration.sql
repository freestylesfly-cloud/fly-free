-- DropForeignKey
ALTER TABLE "CustomizationRequest" DROP CONSTRAINT "CustomizationRequest_userId_fkey";

-- DropTable
DROP TABLE "CustomizationRequest";

-- DropEnum
DROP TYPE "CustomizationStatus";
