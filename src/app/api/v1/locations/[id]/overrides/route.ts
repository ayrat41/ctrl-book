import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { getEffectivePrice } from '@/lib/pricing';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const locationId = p.id;

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const [year, month, day] = dateStr.split('-');
    const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    const end = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);

    const overrides = await prisma.studioModeSchedule.findMany({
      where: {
        locationId,
        startTime: {
          gte: start,
          lte: end
        }
      }
    });

    const pricingMap: Record<string, any> = {};
    const SLOT_TIMES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    // Compute the base Pricing Hierarchy for each hour so the UI has the Inspector stats
    for (const h of SLOT_TIMES) {
      const slotStart = new Date(start);
      slotStart.setHours(h, 0, 0, 0);

      // null studioId because we evaluate the generic Room slot
      const hierarchy = await getEffectivePrice(locationId, null, slotStart);
      pricingMap[h.toString()] = hierarchy;
    }

    return NextResponse.json({ overrides, pricingMap });
  } catch (error) {
    console.error("Fetch overrides err:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
