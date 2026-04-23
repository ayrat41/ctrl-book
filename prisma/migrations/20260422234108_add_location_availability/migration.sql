-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "availableDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "availableHours" INTEGER[] DEFAULT ARRAY[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]::INTEGER[];
