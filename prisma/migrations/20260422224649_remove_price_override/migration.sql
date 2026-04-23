/*
  Warnings:

  - You are about to drop the column `baseHourlyRate` on the `Studio` table. All the data in the column will be lost.
  - You are about to drop the column `priceOverride` on the `StudioModeSchedule` table. All the data in the column will be lost.
  - You are about to drop the `PromoRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PromoRule" DROP CONSTRAINT "PromoRule_targetLocationId_fkey";

-- DropForeignKey
ALTER TABLE "PromoRule" DROP CONSTRAINT "PromoRule_targetStudioId_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "minPriceFloor" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Studio" DROP COLUMN "baseHourlyRate";

-- AlterTable
ALTER TABLE "StudioModeSchedule" DROP COLUMN "priceOverride";

-- DropTable
DROP TABLE "PromoRule";

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startHour" INTEGER,
    "endHour" INTEGER,
    "adjustmentType" TEXT NOT NULL,
    "adjustmentValue" DOUBLE PRECISION NOT NULL,
    "colorCode" TEXT,
    "targetLocationId" TEXT,
    "targetStudioId" TEXT,
    "holidayOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideBackdrop" TEXT,
    "overrideIsActive" BOOLEAN,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_targetStudioId_fkey" FOREIGN KEY ("targetStudioId") REFERENCES "Studio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
