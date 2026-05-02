import prisma from '../lib/prisma';
import { sendReminder } from '../lib/notifications';

async function processReminders() {
  console.log(`[WORKER] Checking for due reminders at ${new Date().toISOString()}...`);

  try {
    const settings = await prisma.notificationSetting.findUnique({ where: { id: "default" } });
    const reminderHours = settings?.reminderHours || 24;

    // Find confirmed bookings where:
    // 1. Reminder hasn't been sent yet
    // 2. The start time is within the next 'reminderHours'
    // 3. The booking is still 'confirmed'
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

    const dueBookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminder24hSent: false,
        startTime: {
          lte: reminderThreshold,
          gt: now, // Must be in the future
        },
      },
      include: {
        customer: true,
        studio: {
          include: {
            location: true,
          },
        },
      },
    });

    console.log(`[WORKER] Found ${dueBookings.length} bookings due for reminders.`);

    for (const booking of dueBookings) {
      try {
        await sendReminder(booking, booking.customer, booking.studio, booking.studio.location);
        
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder24hSent: true }
        });
        
        console.log(`[WORKER] Successfully sent reminder for booking ${booking.id}`);
      } catch (error) {
        console.error(`[WORKER] Failed to send reminder for booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[WORKER] Error in reminder loop:', error);
  }
}

// Simple loop to run every 60 seconds
async function main() {
  console.log('[WORKER] Starting Self-Managed Processor (SMP) for Reminders...');
  
  // Run immediately on start
  await processReminders();

  // Then run every minute
  setInterval(async () => {
    await processReminders();
  }, 60000);
}

main().catch((err) => {
  console.error('[WORKER] Fatal error in main loop:', err);
  process.exit(1);
});
