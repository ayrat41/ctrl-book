"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAddOn(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const isActive = formData.get("isActive") === "on";

    await prisma.addOn.create({
      data: {
        name,
        price,
        isActive,
      },
    });

    revalidatePath("/admin/addons");
    return { success: true };
  } catch (error) {
    console.error("Error creating add-on:", error);
    return { success: false, error: "Failed to create add-on" };
  }
}

export async function toggleAddOnVisibility(id: string, currentState: boolean) {
  try {
    await prisma.addOn.update({
      where: { id },
      data: { isActive: !currentState },
    });

    revalidatePath("/admin/addons");
    return { success: true };
  } catch (error) {
    console.error("Error toggling add-on visibility:", error);
    return { success: false, error: "Failed to update visibility" };
  }
}
