import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const start = new Date('2026-04-23T00:00:00Z');
  const end = new Date('2026-04-23T23:59:59Z');
  const schedules = await prisma.studioModeSchedule.findMany({
    where: {
      startTime: { gte: start, lte: end }
    }
  });
  console.log(JSON.stringify(schedules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
