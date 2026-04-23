import { PrismaClient } from '@prisma/client'
import { getEffectivePrice } from '../src/lib/pricing'

const prisma = new PrismaClient()

async function main() {
  const location = await prisma.location.findFirst()
  if (!location) return
  
  console.log('Location:', location.name, 'Base Price:', location.basePrice)
  
  const date = new Date()
  date.setHours(10, 0, 0, 0)
  
  const hierarchy = await getEffectivePrice(location.id, null, date)
  console.log('Hierarchy at 10:00:', JSON.stringify(hierarchy, null, 2))
}

main()
