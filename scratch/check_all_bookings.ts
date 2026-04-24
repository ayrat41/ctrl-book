import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { startTime: 'desc' },
    include: {
        studio: true
    }
  });

  console.log('Last 10 bookings:');
  bookings.forEach(b => {
    console.log(`- ID: ${b.id}, Studio: ${b.studio.name}, Time: ${b.startTime.toISOString()}, Status: ${b.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
