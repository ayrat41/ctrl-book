"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteLocation(id: string) {
  try {
    // 1. Find the location to get the addressId
    const location = await prisma.location.findUnique({
      where: { id },
      select: { addressId: true }
    });

    if (!location) {
      return { success: false, error: "Location not found." };
    }

    // 2. Delete related records that don't cascade automatically
    // Delete StudioModeSchedule
    await prisma.studioModeSchedule.deleteMany({
      where: { locationId: id }
    });

    // Delete PricingRules
    await prisma.pricingRule.deleteMany({
      where: { targetLocationId: id }
    });

    // Delete Studios (this might have its own dependencies like bookings, blockedSlots)
    const studios = await prisma.studio.findMany({
      where: { locationId: id },
      select: { id: true }
    });
    
    const studioIds = studios.map(s => s.id);
    
    if (studioIds.length > 0) {
      await prisma.blockedSlot.deleteMany({
        where: { studioId: { in: studioIds } }
      });
      await prisma.booking.deleteMany({
        where: { studioId: { in: studioIds } }
      });
      await prisma.studio.deleteMany({
        where: { locationId: id }
      });
    }

    // 3. Delete the location
    await prisma.location.delete({
      where: { id }
    });

    // 4. Delete the address
    await prisma.address.delete({
      where: { id: location.addressId }
    });

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { success: false, error: "Failed to delete location. It may have dependent records like active bookings." };
  }
}
