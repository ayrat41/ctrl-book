import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const locations = await prisma.location.findMany()
  console.log('Locations:', locations)
  const rules = await prisma.pricingRule.findMany()
  console.log('Rules:', rules)
}
main()
