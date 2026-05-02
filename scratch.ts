import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const p1 = await prisma.pricingRule.upsert({
    where: { code: 'MAY3RDWEEK' },
    update: {},
    create: {
      name: 'May 3rd Week Promo',
      ruleType: 'PROMO',
      adjustmentType: 'percentage',
      adjustmentValue: 25.0,
      code: 'MAY3RDWEEK',
      validFrom: new Date('2026-05-01T00:00:00Z'),
      validTo: new Date('2026-05-31T23:59:59Z'),
      isActive: true,
    },
  });

  const p2 = await prisma.pricingRule.upsert({
    where: { code: 'MAY4THWEEK' },
    update: {},
    create: {
      name: 'May 4th Week Promo',
      ruleType: 'PROMO',
      adjustmentType: 'percentage',
      adjustmentValue: 30.0,
      code: 'MAY4THWEEK',
      validFrom: new Date('2026-05-01T00:00:00Z'),
      validTo: new Date('2026-05-31T23:59:59Z'),
      isActive: true,
    },
  });

  console.log('Upserted promos:', p1.code, p2.code);
}

run();
