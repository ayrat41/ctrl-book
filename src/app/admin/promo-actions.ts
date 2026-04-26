"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPromoRule(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const ruleType = formData.get("ruleType") as string;

    const adjustmentType =
      (formData.get("adjustmentType") as string) || "fixed_amount";
    const adjustmentValueRaw =
      (formData.get("adjustmentValue") as string) ||
      (formData.get("discountPercent") as string);
    let adjustmentValue = adjustmentValueRaw
      ? parseFloat(adjustmentValueRaw)
      : 0;

    // Convention: if 'fixed_amount' (Discount) and positive, make it negative
    if (adjustmentType === "fixed_amount" && adjustmentValue > 0) {
      adjustmentValue = -adjustmentValue;
    }

    const overrideIsActive =
      formData.get("isActive") !== null
        ? formData.get("isActive") === "true"
        : null;
    const overrideBackdrop =
      (formData.get("overrideBackdrop") as string) || null;

    let validFrom: Date | null = null;
    let validTo: Date | null = null;
    let daysOfWeek: number[] = [];
    let startHour: number | null = null;
    let endHour: number | null = null;
    let holidayOverride = false;

    // Default color code for UI
    const colorCode = ruleType === "SPECIAL" ? "#ef4444" : "#3b82f6";

    if (formData.get("startHour"))
      startHour = parseInt(formData.get("startHour") as string, 10);
    if (formData.get("endHour"))
      endHour = parseInt(formData.get("endHour") as string, 10);

    if (ruleType === "RECURRING") {
      daysOfWeek = formData
        .getAll("daysOfWeek")
        .map((d) => parseInt(d as string, 10));
      const d = new Date();
      validFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate());

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
      if (formData.get("validFrom"))
        validFrom = new Date(formData.get("validFrom") as string);
      if (formData.get("validTo"))
        validTo = new Date(formData.get("validTo") as string);
      holidayOverride = formData.get("holidayOverride") === "on";
    }

    // Templates are now Global only as per user request
    const targetLocationId = null;
    const targetStudioIds: string[] = [];

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
      daysOfWeek,
      overrideIsActive,
      overrideBackdrop,
      targetLocationId,
      targetStudioIds,
    };

    // Floor Validation
    if (targetLocationId) {
      const loc = await prisma.location.findUnique({ where: { id: targetLocationId } });
      if (loc && loc.basePrice * (1 + (adjustmentValue / 100)) < loc.minPriceFloor && adjustmentType === "percentage") {
         return { success: false, error: `Promo Blocked: This ${Math.abs(adjustmentValue)}% discount violates the $${loc.minPriceFloor} minimum floor for ${loc.name}.` };
      }
    } else {
      // Global Promo Check
      const locations = await prisma.location.findMany();
      for (const loc of locations) {
        let projected = loc.basePrice;
        if (adjustmentType === "percentage") projected = loc.basePrice * (1 + (adjustmentValue / 100));
        else if (adjustmentType === "fixed_amount") projected = loc.basePrice + adjustmentValue;
        
        if (projected < loc.minPriceFloor) {
          return { success: false, error: `Global Promo Blocked: This discount would drop ${loc.name} to $${projected.toFixed(2)}, which is below its $${loc.minPriceFloor} floor. Please target specific locations or reduce the discount.` };
        }
      }
    }

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

export async function updatePromoRule(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const ruleType = formData.get("ruleType") as string;

    const adjustmentType =
      (formData.get("adjustmentType") as string) || "fixed_amount";
    const adjustmentValueRaw =
      (formData.get("adjustmentValue") as string) ||
      (formData.get("discountPercent") as string);
    let adjustmentValue = adjustmentValueRaw
      ? parseFloat(adjustmentValueRaw)
      : 0;

    // Convention: if 'fixed_amount' (Discount) and positive, make it negative
    if (adjustmentType === "fixed_amount" && adjustmentValue > 0) {
      adjustmentValue = -adjustmentValue;
    }

    const overrideIsActive =
      formData.get("isActive") !== null
        ? formData.get("isActive") === "true"
        : null;
    const overrideBackdrop =
      (formData.get("overrideBackdrop") as string) || null;

    let validFrom: Date | null = null;
    let validTo: Date | null = null;
    let daysOfWeek: number[] = [];
    let startHour: number | null = null;
    let endHour: number | null = null;
    let holidayOverride = false;

    // Default color code for UI
    const colorCode = ruleType === "SPECIAL" ? "#ef4444" : "#3b82f6";

    if (formData.get("startHour"))
      startHour = parseInt(formData.get("startHour") as string, 10);
    if (formData.get("endHour"))
      endHour = parseInt(formData.get("endHour") as string, 10);

    if (ruleType === "RECURRING") {
      daysOfWeek = formData
        .getAll("daysOfWeek")
        .map((d) => parseInt(d as string, 10));
      const d = new Date();
      validFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate());

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
      if (formData.get("validFrom"))
        validFrom = new Date(formData.get("validFrom") as string);
      if (formData.get("validTo"))
        validTo = new Date(formData.get("validTo") as string);
      holidayOverride = formData.get("holidayOverride") === "on";
    }

    // Templates are now Global only as per user request
    const targetLocationId = null;
    const targetStudioIds: string[] = [];

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
      daysOfWeek,
      overrideIsActive,
      overrideBackdrop,
      targetLocationId,
      targetStudioIds,
    };

    // Floor Validation (Global check)
    const locations = await prisma.location.findMany();
    for (const loc of locations) {
      let projected = loc.basePrice;
      if (adjustmentType === "percentage") projected = loc.basePrice * (1 + (adjustmentValue / 100));
      else if (adjustmentType === "fixed_amount") projected = loc.basePrice + adjustmentValue;
      
      if (projected < loc.minPriceFloor) {
        return { success: false, error: `Update Blocked: This discount would drop ${loc.name} to $${projected.toFixed(2)}, which is below its $${loc.minPriceFloor} floor.` };
      }
    }

    await prisma.pricingRule.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/promos");
    return { success: true };
  } catch (error) {
    console.error("Error updating promo rule:", error);
    return { success: false, error: "Failed to update promo rule" };
  }
}

export async function deletePromoRule(id: string) {
  try {
    await prisma.pricingRule.delete({
      where: { id },
    });
    revalidatePath("/admin/promos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting promo rule:", error);
    return { success: false, error: "Failed to delete promo rule" };
  }
}

export async function assignPromoRule(
  templateId: string,
  locationId: string,
  studioType: string | null,
) {
  try {
    const template = await prisma.pricingRule.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new Error("Template not found");

    let targetStudioIds: string[] = [];
    if (studioType) {
      const studios = await prisma.studio.findMany({
        where: { locationId, roomId: studioType as any },
      });
      targetStudioIds = studios.map((s) => s.id);
    }

    await prisma.pricingRule.create({
      data: {
        name: template.name,
        ruleType: template.ruleType,
        validFrom: template.validFrom,
        validTo: template.validTo,
        daysOfWeek: template.daysOfWeek,
        startHour: template.startHour,
        endHour: template.endHour,
        adjustmentType: template.adjustmentType,
        adjustmentValue: template.adjustmentValue,
        holidayOverride: template.holidayOverride,
        colorCode: template.colorCode,
        targetLocationId: locationId,
        targetStudioIds: targetStudioIds,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning promo rule:", error);
    return { success: false, error: "Failed to assign template" };
  }
}

export async function createScopedPromoRule(
  formData: FormData,
  locationId: string,
  studioTypes: string[],
) {
  try {
    const name = formData.get("name") as string;
    const ruleType = formData.get("ruleType") as string;
    const adjustmentType =
      (formData.get("adjustmentType") as string) || "fixed_amount";
    const adjustmentValueRaw =
      (formData.get("adjustmentValue") as string) ||
      (formData.get("discountPercent") as string);
    let adjustmentValue = adjustmentValueRaw
      ? parseFloat(adjustmentValueRaw)
      : 0;

    // Convention: if 'fixed_amount' (Discount) and positive, make it negative
    if (adjustmentType === "fixed_amount" && adjustmentValue > 0) {
      adjustmentValue = -adjustmentValue;
    }

    let validFrom: Date | null = null;
    let validTo: Date | null = null;
    let daysOfWeek: number[] = [];
    let startHour: number | null = null;
    let endHour: number | null = null;
    let holidayOverride = false;
    const colorCode = ruleType === "SPECIAL" ? "#ef4444" : "#3b82f6";
    const overrideIsActive = formData.get("overrideIsActive") !== "false";
    const overrideBackdrop = formData.get("overrideBackdrop") as string | null;

    if (formData.get("startHour"))
      startHour = parseInt(formData.get("startHour") as string, 10);
    if (formData.get("endHour"))
      endHour = parseInt(formData.get("endHour") as string, 10);

    if (ruleType === "RECURRING") {
      daysOfWeek = formData
        .getAll("daysOfWeek")
        .map((d) => parseInt(d as string, 10));
      const d = new Date();
      validFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
    } else {
      if (formData.get("validFrom"))
        validFrom = new Date(formData.get("validFrom") as string);
      if (formData.get("validTo"))
        validTo = new Date(formData.get("validTo") as string);
      holidayOverride = formData.get("holidayOverride") === "on";
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { studios: true }
    });

    if (!location) return { success: false, error: "Location not found" };

    // Map room types (e.g. ROOM_WHITE) to actual studio IDs
    const targetStudioIds = location.studios
      .filter(s => studioTypes.includes(s.roomId))
      .map(s => s.id);

    // Validate floor for each studio type targeted
    for (const roomType of studioTypes) {
      let basePrice = location.basePrice;
      const studio = location.studios.find(s => s.roomId === roomType && !s.isSpecial);
      
      if (studio) {
        if (studio.baseAdjustmentType === "percentage") {
          basePrice = basePrice * (1 + (studio.baseAdjustmentValue / 100));
        } else if (studio.baseAdjustmentType === "fixed_amount") {
          basePrice = basePrice + studio.baseAdjustmentValue;
        } else if (studio.baseAdjustmentType === "fixed_override") {
          basePrice = studio.baseAdjustmentValue;
        }
      }

      let projectedPrice = basePrice;
      if (adjustmentType === "percentage") {
        projectedPrice = basePrice * (1 + (adjustmentValue / 100));
      } else if (adjustmentType === "fixed_amount") {
        projectedPrice = basePrice + adjustmentValue;
      } else if (adjustmentType === "fixed_override") {
        projectedPrice = adjustmentValue;
      }

      if (projectedPrice < location.minPriceFloor) {
        return { 
          success: false, 
          error: `Action Blocked: This rule would drop the ${roomType.replace('ROOM_', '')} price to $${projectedPrice.toFixed(2)}, which is below this location's $${location.minPriceFloor.toFixed(2)} floor.` 
        };
      }
    }

    await prisma.pricingRule.create({
      data: {
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
        daysOfWeek,
        targetLocationId: locationId,
        targetStudioIds,
        overrideIsActive,
        overrideBackdrop,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating scoped promo rule:", error);
    return { success: false, error: "Failed to create rule" };
  }
}
