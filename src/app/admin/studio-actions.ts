"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStudioConfig(studioId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const roomId = formData.get("roomId") as any;
    const isSpecial = formData.get("isSpecial") === "true";
    const sessionDuration = parseInt(formData.get("sessionDuration") as string);

    const validFromStr = formData.get("validFrom") as string;
    const validToStr = formData.get("validTo") as string;
    const validFrom = validFromStr ? new Date(validFromStr) : null;
    const validTo = validToStr ? new Date(validToStr) : null;

    const existing = await prisma.studio.findUnique({ where: { id: studioId } });
    if (!existing) return { success: false, error: "Studio not found" };

    // Prevent renaming default studios
    if (!existing.isSpecial && name !== existing.name) {
      return { success: false, error: "Default studios (White/Black) cannot be renamed." };
    }

    await prisma.studio.update({
      where: { id: studioId },
      data: {
        name,
        roomId,
        isSpecial,
        sessionDuration,
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
    const existing = await prisma.studio.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Studio not found" };

    if (!existing.isSpecial) {
      return { success: false, error: "Default studios (White/Black) cannot be deleted. They are required for core operations." };
    }

    const bookings = await prisma.booking.count({ where: { studioId: id } });
    if (bookings > 0) {
      return { success: false, error: "Cannot delete: This studio has active bookings. Archive it instead." };
    }

    const blocked = await prisma.blockedSlot.count({ where: { studioId: id } });
    if (blocked > 0) {
      // We can delete blocked slots or block deletion
      await prisma.blockedSlot.deleteMany({ where: { studioId: id } });
    }

    // Clean up Manual Overrides (StudioModeSchedule) that reference this studio
    await prisma.studioModeSchedule.updateMany({
      where: { activeStudioId: id },
      data: { activeStudioId: null }
    });

    // Clean up Pricing Rules that target this studio
    const rulesWithStudio = await prisma.pricingRule.findMany({
      where: { targetStudioIds: { has: id } }
    });

    for (const rule of rulesWithStudio) {
      await prisma.pricingRule.update({
        where: { id: rule.id },
        data: {
          targetStudioIds: rule.targetStudioIds.filter(sid => sid !== id)
        }
      });
    }

    await prisma.studio.delete({ where: { id } });
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Delete studio error:", error);
    return { success: false, error: "Failed to delete studio. Database constraint error." };
  }
}
