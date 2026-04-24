import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dateStr = '2026-04-24';
  const [year, month, day] = dateStr.split('-');
  const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
  const end = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);

  console.log('Searching between:', start.toISOString(), 'and', end.toISOString());

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['pending', 'confirmed'] },
      startTime: { gte: start, lte: end }
    },
    include: {
        studio: true
    }
  });

  console.log('Bookings found:', bookings.length);
  bookings.forEach(b => {
    console.log(`- Booking ID: ${b.id}`);
    console.log(`  Studio: ${b.studio.name} (${b.studio.roomId})`);
    console.log(`  Time: ${b.startTime.toISOString()} - ${b.endTime.toISOString()}`);
    console.log(`  Status: ${b.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
