import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectivePrice } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studioId, timeSlots, addOns } = body;

    // input validation
    if (!studioId || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json({ error: 'studioId and an array of timeSlots are required' }, { status: 400 });
    }

    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      include: { location: true },
    });

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    let totalDurationHours = 0;
    let earliestStart = new Date(timeSlots[0].start);
    let latestEnd = new Date(timeSlots[0].end);

    for (const slot of timeSlots) {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
         return NextResponse.json({ error: 'Invalid time slot provided' }, { status: 400 });
      }
      if (start < earliestStart) earliestStart = start;
      if (end > latestEnd) latestEnd = end;

      totalDurationHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    let totalBasePrice = 0;
    let totalDiscount = 0;
    let appliedPromoName = null;

    for (const slot of timeSlots) {
      const start = new Date(slot.start);

      // We pass studioId in case the rule specifically targets this studio backdrop
      const pricing = await getEffectivePrice(studio.locationId, studio.id, start);

      const slotBasePrice = pricing.basePrice;
      totalBasePrice += slotBasePrice;
      
      const slotDiscount = pricing.basePrice - pricing.finalPrice;
      totalDiscount += slotDiscount;

      if (pricing.ruleApplied) {
        appliedPromoName = pricing.ruleApplied.name;
      }
    }

    const appliedPromo = appliedPromoName ? { name: appliedPromoName, savings: totalDiscount } : null;

    let subtotal = Math.max(0, totalBasePrice - totalDiscount);
    let addOnsTotal = 0;
    
    if (Array.isArray(addOns)) {
       for (const addon of addOns) {
          if (addon.price) addOnsTotal += Number(addon.price);
       }
    }

    const finalPrice = subtotal + addOnsTotal;

    return NextResponse.json({
      basePrice: totalBasePrice,
      durationHours: totalDurationHours,
      slotsCount: timeSlots.length,
      bestDiscount: totalDiscount,
      addOnsTotal,
      finalPrice,
      appliedPromo
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculating quote:', error);
    return NextResponse.json({ error: 'Failed to calculate pricing quote' }, { status: 500 });
  }
}
