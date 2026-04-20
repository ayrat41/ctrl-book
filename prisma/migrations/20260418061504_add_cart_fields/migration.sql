-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "addOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "groupId" TEXT;
