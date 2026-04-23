import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const rules = await prisma.pricingRule.findMany();
  console.log(JSON.stringify(rules, null, 2));
}
run();
