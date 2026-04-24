"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPromoRule(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const ruleType = formData.get("ruleType") as string;

    const adjustmentType =
      (formData.get("adjustmentType") as string) || "percentage";
    const adjustmentValueRaw =
      (formData.get("adjustmentValue") as string) ||
      (formData.get("discountPercent") as string);
    let adjustmentValue = adjustmentValueRaw
      ? parseFloat(adjustmentValueRaw)
      : 0;

    // Legacy support/UI convention: if using discountPercent field and it's positive, treat as discount (negative)
    if (formData.get("discountPercent") && adjustmentValue > 0) {
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

    const targetLocationId =
      (formData.get("targetLocationId") as string) || null;
    const targetStudioIds = formData
      .getAll("targetStudioIds")
      .map((id) => id as string);

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
      (formData.get("adjustmentType") as string) || "percentage";
    const adjustmentValueRaw =
      (formData.get("adjustmentValue") as string) ||
      (formData.get("discountPercent") as string);
    let adjustmentValue = adjustmentValueRaw
      ? parseFloat(adjustmentValueRaw)
      : 0;

    // UI convention: if using discountPercent field and it's positive, treat as discount (negative)
    if (formData.get("discountPercent") && adjustmentValue > 0) {
      adjustmentValue = -adjustmentValue;
    }

    let validFrom: Date | null = null;
    let validTo: Date | null = null;
    let daysOfWeek: number[] = [];
    let startHour: number | null = null;
    let endHour: number | null = null;
    let holidayOverride = false;
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
    } else {
      if (formData.get("validFrom"))
        validFrom = new Date(formData.get("validFrom") as string);
      if (formData.get("validTo"))
        validTo = new Date(formData.get("validTo") as string);
      holidayOverride = formData.get("holidayOverride") === "on";
    }

    const studios = await prisma.studio.findMany({
      where: {
        locationId,
        roomId: { in: studioTypes as any[] },
      },
    });
    const targetStudioIds = studios.map((s) => s.id);

    const overrideIsActive = formData.get("isActive") === "true";
    const overrideBackdrop =
      (formData.get("overrideBackdrop") as string) || null;

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
