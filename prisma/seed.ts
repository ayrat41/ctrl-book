import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with standardized rooms...");

  // 1. Create Addresses & Locations
  const address1 = await prisma.address.create({
    data: {
      streetLine1: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
  });

  const location1 = await prisma.location.create({
    data: {
      name: "Downtown Brooklyn Branch",
      timezone: "America/New_York",
      addressId: address1.id,
      basePrice: 150,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      streetLine1: "456 Westheimer Rd",
      city: "Houston",
      state: "TX",
      zipCode: "77006",
      country: "USA",
    },
  });

  const location2 = await prisma.location.create({
    data: {
      name: "Montrose Studios",
      timezone: "America/Chicago",
      addressId: address2.id,
      basePrice: 120,
    },
  });

  // 2. Create Standardized Studios for Location 1
  const loc1White = await prisma.studio.create({
    data: {
      name: "White Room",
      locationId: location1.id,
      roomId: "ROOM_WHITE",
    },
  });
  const loc1Black = await prisma.studio.create({
    data: {
      name: "Black Room",
      locationId: location1.id,
      roomId: "ROOM_BLACK",
    },
  });

  // 2. Create Standardized Studios for Location 2
  const loc2White = await prisma.studio.create({
    data: {
      name: "White Room",
      locationId: location2.id,
      roomId: "ROOM_WHITE",
    },
  });
  const loc2Black = await prisma.studio.create({
    data: {
      name: "Black Room",
      locationId: location2.id,
      roomId: "ROOM_BLACK",
    },
  });

  // 3. Create Pricing Rules (Testing Dynamic Pricing)

  // A percentage discount exclusively for Black Room in Location 1
  await prisma.pricingRule.create({
    data: {
      name: "Spring Special",
      ruleType: "SPECIAL",
      adjustmentType: "percentage",
      adjustmentValue: 20, // 20% off
      validFrom: new Date("2026-02-01T00:00:00Z"),
      validTo: new Date("2027-02-28T23:59:59Z"),
      targetStudioIds: [loc1Black.id],
    },
  });

  // A fixed amount discount across all rooms in a whole location
  await prisma.pricingRule.create({
    data: {
      name: "Grand Opening",
      ruleType: "RECURRING",
      adjustmentType: "fixed_amount",
      adjustmentValue: 15.0, // $15 off
      validFrom: new Date("2026-04-01T00:00:00Z"),
      validTo: new Date("2027-12-31T23:59:59Z"),
      targetLocationId: location2.id,
    },
  });

  console.log("Seeding complete! Check your database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
