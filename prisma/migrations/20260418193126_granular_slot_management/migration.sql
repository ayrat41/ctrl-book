-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "StudioModeSchedule" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priceOverride" DOUBLE PRECISION;
