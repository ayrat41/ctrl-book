import { PrismaClient } from '@prisma/client'
import { getEffectivePrice } from '../src/lib/pricing'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const locations = await prisma.location.findMany()
  for (const loc of locations) {
    console.log(`Scanning Location: ${loc.name}`)
    let start = new Date()
    for (let d = 0; d < 365; d++) {
      const currentDay = addDays(start, d)
      for (let h = 9; h <= 20; h++) {
        const date = new Date(currentDay)
        date.setHours(h, 0, 0, 0)
        const hierarchy = await getEffectivePrice(loc.id, null, date)
        if (hierarchy.finalPrice === 0) {
          console.log(`!!! ZERO PRICE at ${currentDay.toISOString()} ${h}:00 !!!`)
          console.log('Hierarchy:', JSON.stringify(hierarchy, null, 2))
          return;
        }
      }
    }
  }
  console.log('Scan complete. No zero prices found for the next year.')
}

main()
