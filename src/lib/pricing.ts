import prisma from "@/lib/prisma";

export async function getEffectivePrice(locationId: string, studioId: string | null, timeslot: Date) {
  // 1. Fetch Location base metrics
  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new Error("Location not found");

  const basePrice = location.basePrice;
  const floor = location.minPriceFloor;

  // Use Intl to get the correct day and hour for the location's timezone
  const locationTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: location.timezone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  }).format(timeslot);
  
  const locationDate = new Date(locationTimeStr);
  const day = locationDate.getDay();
  const hour = locationDate.getHours();

  // 2. Check location-wide availability bounds
  const isWithinLocationBounds = 
    location.availableDays.includes(day) && 
    location.availableHours.includes(hour);

  // 3. Fetch all rules targeting this location explicitly
  const rules = await prisma.pricingRule.findMany({
    where: {
      targetLocationId: locationId
    }
  });

  // Filter to matching studio rules
  // If studioId is provided, keep rules where targetStudioIds includes studioId OR targetStudioIds is empty (location-wide).
  // If studioId is null, keep ALL rules for this location to find the "best available" price.
  const applicableRules = rules.filter(r => 
    !studioId || 
    r.targetStudioIds.length === 0 || 
    r.targetStudioIds.includes(studioId)
  );

  // Filter by lifespan (validFrom / validTo)
  const activeRules = applicableRules.filter(r => {
    if (!r.validFrom || !r.validTo) return true;
    // We compare the raw UTC timeslot against the UTC lifespan bounds
    return timeslot >= r.validFrom && timeslot <= r.validTo;
  });

  // Extract SPECIAL rules
  const specialRules = activeRules.filter(r => r.ruleType === "SPECIAL");

  // Extract RECURRING rules
  const recurringRules = activeRules.filter(r => {
    if (r.ruleType !== "RECURRING") return false;
    if (r.daysOfWeek.length > 0 && !r.daysOfWeek.includes(day)) return false;
    if (r.startHour !== null && hour < r.startHour) return false;
    if (r.endHour !== null && hour >= r.endHour) return false;
    return true;
  });
  const allApplicable = [...specialRules, ...recurringRules];

  // 4. Determine if any rule forces the slot to be inactive
  let isHiddenByRule = false;
  if (!isWithinLocationBounds) {
    isHiddenByRule = true;
  }
  for (const rule of allApplicable) {
    if (rule.overrideIsActive === false) {
      isHiddenByRule = true;
      break;
    }
  }

  // 4. Establish pricing outcome by finding the rule that offers the maximum discount (lowest price)
  let activeRule = null;
  let lowestProjectedPrice = basePrice;

  for (const rule of allApplicable) {
    let projectedPrice = basePrice;
    if (rule.adjustmentType === "percentage") {
      projectedPrice = basePrice * (1 + (rule.adjustmentValue / 100));
    } else if (rule.adjustmentType === "fixed_amount") {
      projectedPrice = basePrice + rule.adjustmentValue; 
    } else if (rule.adjustmentType === "fixed_override") {
      projectedPrice = rule.adjustmentValue;
    }

    if (projectedPrice < lowestProjectedPrice) {
      if (projectedPrice === 0 && basePrice !== 0) {
        console.warn(`[PRICING] Rule "${rule.name}" (${rule.id}) resulted in 0 price. Type: ${rule.adjustmentType}, Value: ${rule.adjustmentValue}`);
      }
      lowestProjectedPrice = projectedPrice;
      activeRule = rule;
    }
  }

  const result = {
    basePrice,
    floor,
    finalPrice: lowestProjectedPrice,
    ruleApplied: activeRule,
    hasCollision: allApplicable.length > 1,
    isActive: !isHiddenByRule
  };

  // Safety Lock Check (clamp to floor)
  result.finalPrice = Math.max(result.finalPrice, floor);

  if (result.finalPrice === 0 && basePrice !== 0) {
    console.warn(`[PRICING] Calculated 0 price for location ${locationId}, studio ${studioId}, time ${timeslot}. Base: ${basePrice}, Floor: ${floor}, Rules count: ${allApplicable.length}`);
  }

  return result;
}
