
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.pricingRule.findMany({
    include: { targetLocation: true }
  });
  console.log(JSON.stringify(rules, null, 2));
}

main().catch(console.error);
