"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPromoRule(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const ruleType = formData.get("ruleType") as string;
    
    // Always strict percentage adjustment for AI uniformity
    const adjustmentType = "percentage";
    const discountPercent = parseFloat(formData.get("discountPercent") as string);
    const adjustmentValue = -(Math.abs(discountPercent)); // always negative

    let validFrom: Date | null = null;
    let validTo: Date | null = null;
    let daysOfWeek: number[] = [];
    let startHour: number | null = null;
    let endHour: number | null = null;
    let holidayOverride = false;
    
    // Default color code for UI
    const colorCode = ruleType === "SPECIAL" ? "#ef4444" : "#3b82f6";
    
    if (formData.get("startHour")) startHour = parseInt(formData.get("startHour") as string, 10);
    if (formData.get("endHour")) endHour = parseInt(formData.get("endHour") as string, 10);

    if (ruleType === "RECURRING") {
       daysOfWeek = formData.getAll("daysOfWeek").map(d => parseInt(d as string, 10));
       validFrom = new Date(); // Starts now
       
       const lifespan = formData.get("lifespan") as string;
       if (lifespan === "1_month") {
         validTo = new Date();
         validTo.setMonth(validTo.getMonth() + 1);
       } else if (lifespan === "3_months") {
         validTo = new Date();
         validTo.setMonth(validTo.getMonth() + 3);
       } else if (lifespan === "12_months") {
         validTo = new Date();
         validTo.setFullYear(validTo.getFullYear() + 1);
       }
       // "forever" leaves validTo = null
    } else {
       // SPECIAL
       if (formData.get("validFrom")) validFrom = new Date(formData.get("validFrom") as string);
       if (formData.get("validTo")) validTo = new Date(formData.get("validTo") as string);
       holidayOverride = formData.get("holidayOverride") === "on";
    }

    const data: any = {
      name,
      ruleType,
      adjustmentType,
      adjustmentValue,
      validFrom,
      validTo,
      startHour,
      endHour,
      holidayOverride,
      colorCode,
      daysOfWeek
    };

    await prisma.pricingRule.create({
      data,
    });

    revalidatePath("/admin/promos");
    return { success: true };
  } catch (error) {
    console.error("Error creating promo rule:", error);
    return { success: false, error: "Failed to create promo rule" };
  }
}
