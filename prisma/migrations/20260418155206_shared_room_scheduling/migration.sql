-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "roomId" TEXT,
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "StudioModeSchedule" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "activeStudioId" TEXT,
    "activeType" TEXT,
    "roomId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioModeSchedule_pkey" PRIMARY KEY ("id")
);
