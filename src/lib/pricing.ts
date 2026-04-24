import prisma from "@/lib/prisma";

export async function getEffectivePrice(locationId: string, studioId: string | null, timeslot: Date) {
  // 1. Fetch Location base metrics
  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new Error("Location not found");

  let basePrice = location.basePrice;
  const floor = location.minPriceFloor;

  // 1.1 Calculate Studio-specific base adjustment
  let studioPremiumAmount = 0;
  let studio = null;
  if (studioId) {
    studio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (studio) {
      if (studio.baseAdjustmentType === "percentage") {
        studioPremiumAmount = basePrice * (studio.baseAdjustmentValue / 100);
      } else if (studio.baseAdjustmentType === "fixed_amount") {
        studioPremiumAmount = studio.baseAdjustmentValue;
      } else if (studio.baseAdjustmentType === "fixed_override") {
        basePrice = studio.baseAdjustmentValue;
      }
    }
  }

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

  // Sort rules by specificity: Targeted > Location-wide, SPECIAL > RECURRING
  const sortedRules = allApplicable.sort((a, b) => {
    // Priority 1: Targeted Studio vs Location-wide
    const aTargeted = studioId && a.targetStudioIds.includes(studioId);
    const bTargeted = studioId && b.targetStudioIds.includes(studioId);
    if (aTargeted && !bTargeted) return -1;
    if (!aTargeted && bTargeted) return 1;

    // Priority 2: SPECIAL vs RECURRING
    if (a.ruleType === "SPECIAL" && b.ruleType === "RECURRING") return -1;
    if (a.ruleType === "RECURRING" && b.ruleType === "SPECIAL") return 1;

    return 0;
  });

  for (const rule of sortedRules) {
    let projectedPrice = basePrice;
    if (rule.adjustmentType === "percentage") {
      projectedPrice = basePrice * (1 + (rule.adjustmentValue / 100));
    } else if (rule.adjustmentType === "fixed_amount") {
      projectedPrice = basePrice + rule.adjustmentValue; 
    } else if (rule.adjustmentType === "fixed_override") {
      projectedPrice = rule.adjustmentValue;
    }

    // If it's a targeted rule, it wins even if it's a premium (higher price)
    // If multiple targeted rules, we pick the first one (most specific)
    const isTargeted = studioId && rule.targetStudioIds.includes(studioId);
    
    if (isTargeted) {
      lowestProjectedPrice = projectedPrice;
      activeRule = rule;
      break; // Stop at the most specific match
    }

    // For location-wide rules, keep the customer-friendly "best price" logic
    if (projectedPrice < lowestProjectedPrice) {
      lowestProjectedPrice = projectedPrice;
      activeRule = rule;
    }
  }

  // 5. Add Studio Premium after discounts have been calculated
  const finalCalculatedPrice = lowestProjectedPrice + studioPremiumAmount;

  const result = {
    basePrice: basePrice + studioPremiumAmount, // Return the actual combined base price for UI display if needed
    floor,
    finalPrice: finalCalculatedPrice,
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
