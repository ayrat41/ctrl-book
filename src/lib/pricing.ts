// Refreshing pricing logic with latest Prisma Client
import prisma from "@/lib/prisma";

export async function getEffectivePrice(
  locationId: string, 
  studioId: string | null, 
  timeslot: Date,
  roomIdParam: string | null = null
) {
  // 1. Fetch Location base metrics
  const location = await prisma.location.findUnique({ where: { id: locationId }, include: { studios: true } });
  if (!location) throw new Error("Location not found");

  let basePrice = location.basePrice;
  const floor = location.minPriceFloor;

  // Derive roomId if not explicitly provided
  let roomId = roomIdParam;
  if (!roomId && studioId) {
    const s = location.studios.find(st => st.id === studioId);
    if (s) roomId = s.roomId;
  }

  // 1.0 Check for Manual Overrides (Highest Priority)
  // Scoped to this specific physical room
  const manualOverride = roomId ? await prisma.studioModeSchedule.findFirst({
    where: {
      locationId,
      startTime: timeslot,
      roomId: roomId as any,
    }
  }) : null;

  let manualAdjustment = 0;
  let manualAdjustmentType = "percentage";
  let isManuallyDisabled = false;

  if (manualOverride) {
    manualAdjustment = manualOverride.discount || 0;
    manualAdjustmentType = manualOverride.adjustmentType || "percentage";
    isManuallyDisabled = !manualOverride.isActive;
  }

  // 1.1 Calculate Studio-specific base adjustment and lifespan check
  let studioPremiumAmount = 0;
  let studio = null;
  let isStudioExpired = false;
  if (studioId) {
    studio = await prisma.studio.findUnique({ where: { id: studioId } });
    if (studio) {
      // Lifespan check for Special Studios
      if (studio.validFrom && timeslot < studio.validFrom) isStudioExpired = true;
      if (studio.validTo && timeslot > studio.validTo) isStudioExpired = true;

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
    r.targetStudioIds.includes(studioId) ||
    (studio && r.targetStudioIds.includes(studio.roomId))
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

  console.log(`[PRICING] Slot ${timeslot.toISOString()}: ${rules.length} total rules, ${applicableRules.length} applicable, ${activeRules.length} active (lifespan), ${allApplicable.length} matching (recurring/special)`);

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
      console.log(`[PRICING] Rule ${rule.name} (TARGETED) won with price ${projectedPrice}`);
      lowestProjectedPrice = projectedPrice;
      activeRule = rule;
      break; // Stop at the most specific match
    }

    // For location-wide rules, keep the customer-friendly "best price" logic
    if (projectedPrice < lowestProjectedPrice) {
      console.log(`[PRICING] Rule ${rule.name} (LOCATION) won with price ${projectedPrice}`);
      lowestProjectedPrice = projectedPrice;
      activeRule = rule;
    }
  }

  if (!activeRule && allApplicable.length > 0) {
    console.log(`[PRICING] No rule won. allApplicable: ${allApplicable.length}, lowestProjectedPrice: ${lowestProjectedPrice}`);
  }

  // 5. Add Studio Premium after discounts have been calculated
  let finalCalculatedPrice = lowestProjectedPrice + studioPremiumAmount;

  // 6. Apply Manual Override Discount if present (applies after all rules)
  if (manualAdjustmentType === "percentage") {
    finalCalculatedPrice = finalCalculatedPrice * (1 + (manualAdjustment / 100));
  } else if (manualAdjustmentType === "fixed_amount") {
    finalCalculatedPrice = finalCalculatedPrice + manualAdjustment;
  } else if (manualAdjustmentType === "fixed_override") {
    finalCalculatedPrice = manualAdjustment;
  }

  const result = {
    basePrice: basePrice + studioPremiumAmount, 
    floor,
    finalPrice: finalCalculatedPrice,
    ruleApplied: activeRule,
    hasCollision: allApplicable.length > 1,
    isActive: !isHiddenByRule && !isManuallyDisabled && !isStudioExpired
  };

  // Safety Lock Check (clamp to floor)
  result.finalPrice = Math.max(result.finalPrice, floor);

  if (result.finalPrice === 0 && basePrice !== 0) {
    console.warn(`[PRICING] Calculated 0 price for location ${locationId}, studio ${studioId}, time ${timeslot}. Base: ${basePrice}, Floor: ${floor}, Rules count: ${allApplicable.length}`);
  }

  return result;
}
