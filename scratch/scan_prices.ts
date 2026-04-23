import { PrismaClient } from '@prisma/client'
import { getEffectivePrice } from '../src/lib/pricing'

const prisma = new PrismaClient()

async function main() {
  const locations = await prisma.location.findMany()
  for (const loc of locations) {
    console.log(`Checking Location: ${loc.name} (Base: ${loc.basePrice})`)
    for (let h = 9; h <= 20; h++) {
      const date = new Date()
      date.setHours(h, 0, 0, 0)
      const hierarchy = await getEffectivePrice(loc.id, null, date)
      if (hierarchy.finalPrice === 0) {
        console.log(`!!! ZERO PRICE at ${h}:00 !!!`)
        console.log('Hierarchy:', JSON.stringify(hierarchy, null, 2))
      }
    }
  }
}

main()
