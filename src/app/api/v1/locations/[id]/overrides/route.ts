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
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        activeStudioId: true,
        activeType: true,
        roomId: true,
        locationId: true,
        discount: true,
        isActive: true
      }
    });

    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const pricingMap: Record<string, any> = {};
    const SLOT_TIMES = location.availableHours;
    
    // Compute the base Pricing Hierarchy for each hour so the UI has the Inspector stats
    for (const h of SLOT_TIMES) {
      const slotStart = new Date(start);
      slotStart.setHours(h, 0, 0, 0);

      // null studioId because we evaluate the generic Room slot
      const hierarchy = await getEffectivePrice(locationId, null, slotStart);
      pricingMap[h.toString()] = hierarchy;
    }

    const abstractTemplates = await prisma.pricingRule.findMany({
      where: { targetLocationId: null }
    });

    const assignedRules = await prisma.pricingRule.findMany({
      where: { targetLocationId: locationId }
    });

    const dayOfWeek = start.getDay();
    const relevantRules = assignedRules.filter(rule => {
      const ruleFrom = rule.validFrom ? new Date(rule.validFrom) : null;
      const ruleTo = rule.validTo ? new Date(rule.validTo) : null;
      if (ruleFrom && start < ruleFrom) return false;
      if (ruleTo && start > ruleTo) return false;

      if (rule.ruleType === "RECURRING" && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        if (!rule.daysOfWeek.includes(dayOfWeek)) return false;
      }
      return true;
    });

    const virtualOverrides: any[] = [];
    const studios = await prisma.studio.findMany({
      where: { locationId },
      select: { id: true, roomId: true, type: true }
    });

    for (const rule of relevantRules) {
      // A rule is relevant if it has an active override (isActive=false, backdrop, or discount)
      const hasActiveOverride = 
        rule.overrideIsActive === false || 
        rule.overrideBackdrop !== null || 
        rule.adjustmentValue !== 0;

      if (hasActiveOverride) {
        const sHour = rule.startHour != null ? rule.startHour : 9;
        const eHour = rule.endHour != null ? rule.endHour : 21;
        
        // Find which rooms/studios this rule applies to
        const targetStudios = rule.targetStudioId 
          ? studios.filter(s => s.id === rule.targetStudioId)
          : studios; // If no studio filter, it applies to all studios in the location

        for (let h = sHour; h < eHour; h++) {
           const slotStart = new Date(start);
           slotStart.setHours(h, 0, 0, 0);
           const slotEnd = new Date(start);
           slotEnd.setHours(h, 45, 0, 0);
           
           // We need unique room IDs to avoid duplicate virtual overrides in the same room
           const roomIds = Array.from(new Set(targetStudios.map(s => s.roomId).filter(Boolean)));

           for (const roomId of roomIds) {
             virtualOverrides.push({
               id: `virtual_${rule.id}_${h}_${roomId}`,
               roomId: roomId,
               locationId,
               startTime: slotStart,
               endTime: slotEnd,
               isActive: rule.overrideIsActive !== false,
               activeStudioId: rule.targetStudioId,
               activeType: rule.overrideBackdrop,
               discount: Math.abs(rule.adjustmentValue || 0),
               isVirtual: true,
               ruleId: rule.id
             });
           }
        }
      }
    }

    const allOverrides = [...overrides, ...virtualOverrides];

    if (Object.values(pricingMap).some(h => h.finalPrice === 0)) {
      console.warn("[OVERRIDES API] Found zero prices in pricingMap!");
    }

    return NextResponse.json({ overrides: allOverrides, pricingMap, abstractTemplates, assignedRules });
  } catch (error) {
    console.error("Fetch overrides err:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
