"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStudioConfig(studioId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const roomId = formData.get("roomId") as any;
    const isSpecial = formData.get("isSpecial") === "true";
    const sessionDuration = parseInt(formData.get("sessionDuration") as string);
    const maxCapacity = parseInt(formData.get("maxCapacity") as string);

    const validFromStr = formData.get("validFrom") as string;
    const validToStr = formData.get("validTo") as string;
    const validFrom = validFromStr ? new Date(validFromStr) : null;
    const validTo = validToStr ? new Date(validToStr) : null;

    await prisma.studio.update({
      where: { id: studioId },
      data: {
        name,
        roomId,
        isSpecial,
        sessionDuration,
        maxCapacity,
        validFrom,
        validTo,
        baseAdjustmentType: (formData.get("baseAdjustmentType") as string) || "fixed_amount",
        baseAdjustmentValue: parseFloat((formData.get("baseAdjustmentValue") as string) || "0"),
      }
    });

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error updating studio config:", error);
    return { success: false, error: "Failed to update studio configuration" };
  }
}

export async function createStudio(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const roomId = formData.get("roomId") as any;
    const isSpecial = formData.get("isSpecial") === "true";
    const sessionDuration = parseInt(formData.get("sessionDuration") as string);
    const maxCapacity = parseInt(formData.get("maxCapacity") as string);
    const locationId = formData.get("locationId") as string;

    const validFromStr = formData.get("validFrom") as string;
    const validToStr = formData.get("validTo") as string;
    const validFrom = validFromStr ? new Date(validFromStr) : null;
    const validTo = validToStr ? new Date(validToStr) : null;

    await prisma.studio.create({
      data: {
        name,
        description,
        roomId,
        isSpecial,
        sessionDuration,
        maxCapacity,
        locationId,
        validFrom,
        validTo,
        baseAdjustmentType: (formData.get("baseAdjustmentType") as string) || "fixed_amount",
        baseAdjustmentValue: parseFloat((formData.get("baseAdjustmentValue") as string) || "0"),
      }
    });

    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error creating studio:", error);
    return { success: false, error: "Failed to create studio" };
  }
}

export async function deleteStudio(id: string) {
  try {
    const bookings = await prisma.booking.count({ where: { studioId: id } });
    if (bookings > 0) {
      return { success: false, error: "Cannot delete studio with active bookings. Archive it instead (TBD)." };
    }

    await prisma.studio.delete({ where: { id } });
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete studio" };
  }
}
