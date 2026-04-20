"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStudioConfig(studioId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const roomId = formData.get("roomId") as string;
    const sessionDuration = parseInt(formData.get("sessionDuration") as string);
    const maxCapacity = parseInt(formData.get("maxCapacity") as string);

    await prisma.studio.update({
      where: { id: studioId },
      data: {
        name,
        type,
        roomId,
        sessionDuration,
        maxCapacity
      }
    });

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error updating studio config:", error);
    return { success: false, error: "Failed to update studio configuration" };
  }
}
