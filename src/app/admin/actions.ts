// Refreshing admin actions with latest Prisma Client
"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function blockSlot(studioId: string, startTime: Date, endTime: Date) {
  try {
    await prisma.blockedSlot.create({
      data: {
        studioId,
        startTime,
        endTime,
        reason: "Admin Manual Block"
      }
    });
    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to block slot" };
  }
}

export async function unblockSlot(studioId: string, startTime: Date, endTime: Date) {
  try {
    await prisma.blockedSlot.deleteMany({
      where: {
        studioId,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });
    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to unblock slot" };
  }
}

export async function setActiveStudioMode(roomId: string, studioId: string, startTime: Date, endTime: Date, locationId: string) {
  try {
    // Delete any existing schedule for this slot/room first to avoid overlaps
    await prisma.studioModeSchedule.deleteMany({
      where: {
        roomId: roomId as any,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });

    // Create the new override
    await prisma.studioModeSchedule.create({
      data: {
        roomId: roomId as any,
        activeStudioId: studioId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        locationId
      }
    });

    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (err) {
    console.error("Set active mode err:", err);
    return { success: false, error: "Failed to set active mode" };
  }
}

export async function clearModeOverride(roomId: string, startTime: Date, endTime: Date) {
  try {
    await prisma.studioModeSchedule.deleteMany({
      where: {
        roomId: roomId as any,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });
    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to clear mode" };
  }
}

export async function updateSlotSettings(data: {
  roomId: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  activeStudioId: string | null;
  adjustmentValue: number;
  adjustmentType: string;
  isActive: boolean;
}) {
  try {
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
      include: { studios: true }
    });

    if (!location) return { success: false, error: "Location not found" };

    // 1. Calculate the hypothetical base price for this room
    let basePrice = location.basePrice;
    const studio = data.activeStudioId 
      ? location.studios.find(s => s.id === data.activeStudioId)
      : location.studios.find(s => s.roomId === data.roomId && !s.isSpecial);

    if (studio) {
      if (studio.baseAdjustmentType === "percentage") {
        basePrice = basePrice * (1 + (studio.baseAdjustmentValue / 100));
      } else if (studio.baseAdjustmentType === "fixed_amount") {
        basePrice = basePrice + studio.baseAdjustmentValue;
      } else if (studio.baseAdjustmentType === "fixed_override") {
        basePrice = studio.baseAdjustmentValue;
      }
    }

    // 2. Calculate projected price based on adjustment
    let projectedPrice = basePrice;
    if (data.adjustmentType === "percentage") {
      projectedPrice = basePrice * (1 + (data.adjustmentValue / 100));
    } else if (data.adjustmentType === "fixed_amount") {
      projectedPrice = basePrice + data.adjustmentValue;
    } else if (data.adjustmentType === "fixed_override") {
      projectedPrice = data.adjustmentValue;
    }
    
    if (data.isActive && projectedPrice < location.minPriceFloor) {
      return { 
        success: false, 
        error: `Action Blocked: This adjustment would drop the price to $${projectedPrice.toFixed(2)}, which is below this location's $${location.minPriceFloor.toFixed(2)} floor.` 
      };
    }

    const existing = await prisma.studioModeSchedule.findFirst({
      where: {
        roomId: data.roomId as any,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime)
      }
    });

    if (existing) {
      await prisma.studioModeSchedule.update({
        where: { id: existing.id },
        data: {
          activeStudioId: data.activeStudioId,
          discount: data.adjustmentValue, // mapped to adjustmentValue
          adjustmentType: data.adjustmentType,
          isActive: data.isActive
        }
      });
    } else {
      await prisma.studioModeSchedule.create({
        data: {
          roomId: data.roomId as any,
          locationId: data.locationId,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          activeStudioId: data.activeStudioId,
          discount: data.adjustmentValue, // mapped to adjustmentValue
          adjustmentType: data.adjustmentType,
          isActive: data.isActive
        }
      });
    }

    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (err) {
    console.error("Update slot err:", err);
    return { success: false, error: "Failed to update slot" };
  }
}

