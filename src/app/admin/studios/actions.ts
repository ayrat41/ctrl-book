"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStudio(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const roomId = formData.get("roomId") as string;
    const sessionDuration = parseInt(formData.get("sessionDuration") as string);
    const maxCapacity = parseInt(formData.get("maxCapacity") as string);
    const locationId = formData.get("locationId") as string;

    await prisma.studio.create({
      data: {
        name,
        description,
        type,
        roomId: roomId || null,
        sessionDuration,
        maxCapacity,
        locationId
      }
    });

    revalidatePath("/admin/studios");
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error creating studio:", error);
    return { success: false, error: "Failed to create studio" };
  }
}

export async function deleteStudio(id: string) {
  try {
    // Check if there are any dependent bookings or schedules
    const bookings = await prisma.booking.count({ where: { studioId: id } });
    if (bookings > 0) {
      return { success: false, error: "Cannot delete studio with active bookings. Archive it instead (TBD)." };
    }

    await prisma.studio.delete({ where: { id } });
    revalidatePath("/admin/studios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete studio" };
  }
}
