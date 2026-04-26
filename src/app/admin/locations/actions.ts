"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLocationPricing(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const minPriceFloor = parseFloat(formData.get("minPriceFloor") as string);

    if (isNaN(basePrice) || isNaN(minPriceFloor)) {
      return { success: false, error: "Invalid price inputs." };
    }
    
    if (minPriceFloor > basePrice) {
      return { success: false, error: "A Minimum Price Floor cannot exceed the Location's standard Base Rate." };
    }

    if (minPriceFloor < 0) {
      return { success: false, error: "Minimum Price Floor cannot be less than 0." };
    }

    const availableDays = formData.getAll("availableDays").map(d => parseInt(d as string, 10));
    const availableHours = formData.getAll("availableHours").map(h => parseInt(h as string, 10));

    await prisma.location.update({
      where: { id },
      data: {
        basePrice,
        minPriceFloor,
        availableDays,
        availableHours
      }
    });

    revalidatePath("/admin/locations");
    revalidatePath("/admin/schedule-management");
    return { success: true };
  } catch (error) {
    console.error("Error updating location pricing:", error);
    return { success: false, error: "Failed to update location metrics." };
  }
}

export async function createLocation(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const timezone = formData.get("timezone") as string;
    console.log(`[ADMIN] Attempting to create location: ${name} (${timezone})`);

    // Prevent duplicate location names
    const existing = await prisma.location.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existing) {
      return { success: false, error: `A location with the name "${name}" already exists.` };
    }
    
    const basePrice = parseFloat(formData.get("basePrice") as string) || 100;
    const minPriceFloor = parseFloat(formData.get("minPriceFloor") as string) || 0;

    if (minPriceFloor > basePrice) {
      return { success: false, error: "A Minimum Price Floor cannot exceed the Location's standard Base Rate." };
    }

    if (minPriceFloor < 0) {
      return { success: false, error: "Minimum Price Floor cannot be less than 0." };
    }
    
    const streetLine1 = formData.get("streetLine1") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const country = formData.get("country") as string;

    const availableDays = formData.getAll("availableDays").map(d => parseInt(d as string, 10));
    const availableHours = formData.getAll("availableHours").map(h => parseInt(h as string, 10));

    await prisma.location.create({
      data: {
        name,
        timezone,
        basePrice,
        minPriceFloor,
        availableDays,
        availableHours,
        address: {
          create: {
            streetLine1,
            city,
            state,
            zipCode,
            country
          }
        },
        studios: {
          create: [
            { name: "White Room", roomId: "ROOM_WHITE" },
            { name: "Black Room", roomId: "ROOM_BLACK" }
          ]
        }
      }
    });

    console.log(`[ADMIN] Successfully created location: ${name}`);
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Error creating location:", error);
    return { success: false, error: "Failed to create location." };
  }
}
