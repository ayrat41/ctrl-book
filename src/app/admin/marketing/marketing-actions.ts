"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMarketingCampaign(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const channel = (formData.get("channel") as string) || null;
    const adjustmentType =
      (formData.get("adjustmentType") as string) || "percentage";
    const rawValue = parseFloat(formData.get("adjustmentValue") as string);
    const maxUsesRaw = formData.get("maxUses") as string;
    const validFromRaw = formData.get("validFrom") as string;
    const validToRaw = formData.get("validTo") as string;

    if (!name || !code) {
      return { success: false, error: "Name and code are required." };
    }

    if (isNaN(rawValue)) {
      return { success: false, error: "Discount value must be a number." };
    }

    // Positive input means discount → store as negative for adjustmentValue (percentage/fixed_amount)
    const adjustmentValue =
      adjustmentType === "fixed_override" ? rawValue : -Math.abs(rawValue);

    const maxUses =
      maxUsesRaw && maxUsesRaw.trim() !== ""
        ? parseInt(maxUsesRaw, 10)
        : null;

    const validFrom =
      validFromRaw && validFromRaw.trim() !== ""
        ? new Date(validFromRaw)
        : null;
    const validTo =
      validToRaw && validToRaw.trim() !== "" ? new Date(validToRaw) : null;

    const rule = await prisma.pricingRule.create({
      data: {
        name,
        code,
        channel,
        adjustmentType,
        adjustmentValue,
        maxUses,
        validFrom,
        validTo,
        ruleType: "PROMO",
        isActive: true,
        currentUses: 0,
        daysOfWeek: [],
        targetStudioIds: [],
        holidayOverride: false,
        colorCode: "#a855f7",
      },
    });

    revalidatePath("/admin/marketing");
    return { success: true, rule };
  } catch (error: any) {
    console.error("[MARKETING] Error creating campaign:", error);
    if (error.code === "P2002") {
      return {
        success: false,
        error: "That promo code is already in use. Please choose another.",
      };
    }
    return { success: false, error: "Failed to create campaign." };
  }
}
