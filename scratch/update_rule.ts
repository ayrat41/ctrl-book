
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.pricingRule.findFirst({
    where: { name: 'Weekday -15%' }
  });

  if (rule) {
    const studios = await prisma.studio.findMany({
      where: { locationId: rule.targetLocationId! }
    });
    const allStudioIds = studios.map(s => s.id);

    await prisma.pricingRule.update({
      where: { id: rule.id },
      data: { targetStudioIds: allStudioIds }
    });

    console.log("Rule updated to include all studios:", allStudioIds);
  } else {
    console.log("Rule not found.");
  }
}

main().catch(console.error);
