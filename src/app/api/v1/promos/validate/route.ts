import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Promo code is required." },
        { status: 400 },
      );
    }

    const rule = await prisma.pricingRule.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!rule) {
      return NextResponse.json(
        { valid: false, error: "Promo code not found." },
        { status: 404 },
      );
    }

    // Validate isActive flag
    if (!rule.isActive) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active." },
        { status: 400 },
      );
    }

    // Validate date range
    const now = new Date();
    if (rule.validFrom && now < rule.validFrom) {
      return NextResponse.json(
        { valid: false, error: "This promo code is not yet valid." },
        { status: 400 },
      );
    }
    if (rule.validTo && now > rule.validTo) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired." },
        { status: 400 },
      );
    }

    // Validate usage limit
    if (rule.maxUses !== null && rule.currentUses >= rule.maxUses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its usage limit." },
        { status: 400 },
      );
    }

    // All checks passed
    return NextResponse.json({ valid: true, rule });
  } catch (error: any) {
    console.error("[PROMO VALIDATE] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
