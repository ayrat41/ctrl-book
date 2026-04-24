import prisma from "@/lib/prisma";
import MarketingHubClient from "./MarketingHubClient";

export default async function MarketingHubPage() {
  // Fetch campaigns (PricingRules with a promo code)
  const campaigns = await prisma.pricingRule.findMany({
    where: { code: { not: null } },
    orderBy: { currentUses: "desc" },
  });

  // Fetch all bookings with UTM source and revenue data
  const bookings = await prisma.booking.findMany({
    where: { status: "confirmed" },
    select: {
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      finalPrice: true,
      pricingRuleId: true,
    },
  });

  // Aggregate analytics by UTM source
  const analyticsMap: Record<
    string,
    { bookings: number; revenue: number }
  > = {};

  for (const b of bookings) {
    const source = b.utmSource || "(direct)";
    if (!analyticsMap[source]) {
      analyticsMap[source] = { bookings: 0, revenue: 0 };
    }
    analyticsMap[source].bookings++;
    analyticsMap[source].revenue += b.finalPrice;
  }

  const analytics = Object.entries(analyticsMap)
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <MarketingHubClient
      campaigns={campaigns as any}
      analytics={analytics}
    />
  );
}
