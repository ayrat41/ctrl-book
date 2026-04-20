import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with standardized rooms...')

  // Clean up existing data (optional, but good for reliable seeding)
  await prisma.booking.deleteMany({})
  await prisma.promoRule.deleteMany({})
  await prisma.studio.deleteMany({})
  await prisma.location.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.customer.deleteMany({})

  // 1. Create Addresses & Locations
  const address1 = await prisma.address.create({
    data: {
      streetLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    }
  })

  const location1 = await prisma.location.create({
    data: {
      name: 'Downtown Brooklyn Branch',
      timezone: 'America/New_York',
      addressId: address1.id,
    }
  })

  const address2 = await prisma.address.create({
    data: {
      streetLine1: '456 Westheimer Rd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77006',
      country: 'USA',
    }
  })

  const location2 = await prisma.location.create({
    data: {
      name: 'Montrose Studios',
      timezone: 'America/Chicago',
      addressId: address2.id,
    }
  })

  // 2. Create Standardized Studios for Location 1
  const loc1White = await prisma.studio.create({
    data: { name: 'White Room', maxCapacity: 15, baseHourlyRate: 150.00, locationId: location1.id }
  })
  const loc1Special = await prisma.studio.create({
    data: { name: 'Special Room', maxCapacity: 10, baseHourlyRate: 200.00, locationId: location1.id }
  })
  const loc1Black = await prisma.studio.create({
    data: { name: 'Black Room', maxCapacity: 15, baseHourlyRate: 150.00, locationId: location1.id }
  })

  // 2. Create Standardized Studios for Location 2
  const loc2White = await prisma.studio.create({
    data: { name: 'White Room', maxCapacity: 15, baseHourlyRate: 150.00, locationId: location2.id }
  })
  const loc2Special = await prisma.studio.create({
    data: { name: 'Special Room', maxCapacity: 10, baseHourlyRate: 200.00, locationId: location2.id }
  })
  const loc2Black = await prisma.studio.create({
    data: { name: 'Black Room', maxCapacity: 15, baseHourlyRate: 150.00, locationId: location2.id }
  })

  // 3. Create Promo Rules (Testing Dynamic Pricing)
  
  // A percentage discount exclusively for Special Room in Location 1
  await prisma.promoRule.create({
    data: {
      name: 'Black History Month Special',
      discountType: 'percentage',
      discountValue: 20, // 20% off
      validFrom: new Date('2026-02-01T00:00:00Z'),
      validTo: new Date('2027-02-28T23:59:59Z'),
      targetStudioId: loc1Special.id,
    }
  })

  // A fixed amount discount across all rooms in a whole location
  await prisma.promoRule.create({
    data: {
      name: 'Montrose Grand Opening',
      discountType: 'fixed_amount',
      discountValue: 15.00, // $15 off per hour
      validFrom: new Date('2026-04-01T00:00:00Z'),
      validTo: new Date('2027-12-31T23:59:59Z'),
      targetLocationId: location2.id,
    }
  })

  console.log('Seeding complete! Check your database.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
