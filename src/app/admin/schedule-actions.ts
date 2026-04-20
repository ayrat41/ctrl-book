"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createModeSchedule(formData: FormData) {
  try {
    const roomId = formData.get("roomId") as string;
    const activeType = formData.get("activeType") as string;
    const date = formData.get("date") as string; // YYYY-MM-DD
    const startTimeStr = formData.get("startTime") as string; // HH:mm
    const endTimeStr = formData.get("endTime") as string; // HH:mm
    const locationId = formData.get("locationId") as string;

    const start = new Date(`${date}T${startTimeStr}:00`);
    const end = new Date(`${date}T${endTimeStr}:00`);

    await prisma.studioModeSchedule.create({
      data: {
        roomId,
        activeType,
        startTime: start,
        endTime: end,
        locationId
      }
    });

    revalidatePath("/admin/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error creating mode schedule:", error);
    return { success: false, error: "Failed to create schedule" };
  }
}

export async function deleteModeSchedule(id: string) {
  try {
    await prisma.studioModeSchedule.delete({
      where: { id }
    });
    revalidatePath("/admin/schedule");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete schedule" };
  }
}
