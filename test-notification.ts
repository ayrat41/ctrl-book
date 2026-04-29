import { PrismaClient } from '@prisma/client';
import { sendConfirmation } from './src/lib/notifications';

const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findFirst({
    include: {
      customer: true,
      studio: { include: { location: true } }
    },
    orderBy: { startTime: 'desc' }
  });

  if (!booking) {
    console.log("No bookings found");
    return;
  }

  console.log(`Testing notifications for booking ${booking.id}...`);
  try {
    await sendConfirmation(booking, booking.customer, booking.studio, booking.studio.location);
    console.log("sendConfirmation completed.");
  } catch (e) {
    console.error("sendConfirmation threw an error:", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
