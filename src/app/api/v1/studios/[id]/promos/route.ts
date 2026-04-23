import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studioId } = await params;
    const now = new Date();

    // Fetch promos that are currently valid and target this studio,
    // its location, or are global.
    
    // First, get the studio to find its locationId
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { locationId: true }
    });

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    const promos = await prisma.pricingRule.findMany({
      where: {
        validFrom: { lte: now },
        validTo: { gte: now },
        OR: [
          { targetStudioId: studioId },
          { targetLocationId: studio.locationId },
          { 
            AND: [
              { targetStudioId: null },
              { targetLocationId: null }
            ]
          }
        ]
      },
      orderBy: { adjustmentValue: "asc" } // For discounts (negative values), asc gives max discount
    });

    return NextResponse.json(promos);
  } catch (error) {
    console.error("Error fetching studio promos:", error);
    return NextResponse.json({ error: "Failed to fetch promos" }, { status: 500 });
  }
}
