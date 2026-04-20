import prisma from "@/lib/prisma";

export async function getEffectivePrice(locationId: string, studioId: string | null, timeslot: Date) {
  // 1. Fetch Location base metrics
  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new Error("Location not found");

  const basePrice = location.basePrice;
  const floor = location.minPriceFloor;

  // 2. Fetch all rules targeting this location (or global)
  const rules = await prisma.pricingRule.findMany({
    where: {
      OR: [
        { targetLocationId: locationId },
        { targetLocationId: null }
      ]
    }
  });

  // Filter to matching studio rules (if targeted)
  const applicableRules = rules.filter(r => !r.targetStudioId || r.targetStudioId === studioId);

  // Extract SPECIAL rules
  const specialRules = applicableRules.filter(r => {
    if (r.ruleType !== "SPECIAL") return false;
    if (!r.validFrom || !r.validTo) return true; // generic special? Assume it needs dates
    return timeslot >= r.validFrom && timeslot <= r.validTo;
  });

  // Extract RECURRING rules
  const recurringRules = applicableRules.filter(r => {
    if (r.ruleType !== "RECURRING") return false;
    const day = timeslot.getDay();
    if (r.daysOfWeek.length > 0 && !r.daysOfWeek.includes(day)) return false;
    const hour = timeslot.getHours();
    if (r.startHour !== null && hour < r.startHour) return false;
    if (r.endHour !== null && hour >= r.endHour) return false;
    return true;
  });

  // Establish hierarchy
  let activeRule = null;
  if (specialRules.length > 0) {
    activeRule = specialRules[0]; // Apply earliest matched special
  } else if (recurringRules.length > 0) {
    activeRule = recurringRules[0]; // Apply earliest matched recurring
  }

  const result = {
    basePrice,
    floor,
    finalPrice: basePrice,
    ruleApplied: activeRule,
    hasCollision: specialRules.length > 0 && recurringRules.length > 0
  };

  if (activeRule) {
    if (activeRule.adjustmentType === "percentage") {
      result.finalPrice = basePrice * (1 + (activeRule.adjustmentValue / 100));
    } else if (activeRule.adjustmentType === "fixed_amount") {
      result.finalPrice = basePrice + activeRule.adjustmentValue; 
    } else if (activeRule.adjustmentType === "fixed_override") {
      result.finalPrice = activeRule.adjustmentValue;
    }
  }

  // Safety Lock Check (clamp to floor)
  result.finalPrice = Math.max(result.finalPrice, floor);

  return result;
}
