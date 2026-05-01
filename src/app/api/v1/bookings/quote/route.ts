import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectivePrice } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studioId, timeSlots, addOns, promoCode, locationId } = body;

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

    // Fetch user promo if provided
    let userPromoRule = null;
    if (promoCode) {
      userPromoRule = await prisma.pricingRule.findUnique({
        where: { code: promoCode.trim().toUpperCase(), isActive: true }
      });
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
    let totalFloor = 0;
    let appliedPromoName = null;
    let userPromoDiscount = 0;

    for (const slot of timeSlots) {
      const start = new Date(slot.start);
      const currentStudioId = slot.studioId || studioId;
      const targetLocationId = locationId || studio.locationId;

      // 1. Get best automatic price
      const pricing = await getEffectivePrice(targetLocationId, currentStudioId, start);

      const slotBasePrice = pricing.basePrice;
      totalBasePrice += slotBasePrice;
      
      const slotAutoDiscount = pricing.basePrice - pricing.finalPrice;
      totalDiscount += slotAutoDiscount;
      totalFloor += pricing.floor;

      if (pricing.ruleApplied) {
        appliedPromoName = pricing.ruleApplied.name;
      }

      // 2. Apply user-entered promo code if valid for THIS slot's date
      if (userPromoRule) {
        const isDateValid = (!userPromoRule.validFrom || start >= userPromoRule.validFrom) && 
                            (!userPromoRule.validTo || start <= userPromoRule.validTo);
        
        if (isDateValid) {
          const slotPrice = pricing.finalPrice;
          let disc = 0;
          if (userPromoRule.adjustmentType === "percentage") {
            disc = slotPrice * (Math.abs(Number(userPromoRule.adjustmentValue)) / 100);
          } else if (userPromoRule.adjustmentType === "fixed_amount") {
            disc = Math.abs(Number(userPromoRule.adjustmentValue));
          }
          
          // Check if this discount would push this slot below its floor
          if (slotPrice - disc < pricing.floor) {
             return NextResponse.json({ 
               error: 'Promo code inactive',
               details: 'This discount would drop the price below the minimum floor for this location.' 
             }, { status: 400 });
          }

          userPromoDiscount += disc;
        }
      }
    }

    const appliedPromo = appliedPromoName ? { name: appliedPromoName, savings: totalDiscount } : null;

    let subtotal = Math.max(0, totalBasePrice - totalDiscount - userPromoDiscount);
    let addOnsTotal = 0;
    
    if (Array.isArray(addOns)) {
       for (const addon of addOns) {
          if (addon.price) addOnsTotal += Number(addon.price);
       }
    }

    const rescheduleFee = body.applyFee ? 90 : 0;
    const finalPrice = subtotal + addOnsTotal + rescheduleFee;

    return NextResponse.json({
      basePrice: totalBasePrice,
      durationHours: totalDurationHours,
      slotsCount: timeSlots.length,
      bestDiscount: totalDiscount + userPromoDiscount,
      userPromoDiscount,
      totalFloor,
      addOnsTotal,
      rescheduleFee,
      finalPrice,
      appliedPromo: userPromoRule ? { name: userPromoRule.name, savings: userPromoDiscount } : appliedPromo
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculating quote:', error);
    return NextResponse.json({ error: 'Failed to calculate pricing quote' }, { status: 500 });
  }
}
