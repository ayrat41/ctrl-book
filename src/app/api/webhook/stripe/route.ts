import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { sendConfirmation, scheduleReminder } from '@/lib/notifications';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === 'checkout.session.completed') {
    const metadata = session.metadata;
    const groupId = metadata.groupId || session.id;

    // Update existing pending bookings to confirmed
    const result = await prisma.booking.updateMany({
        where: { groupId: groupId },
        data: { status: 'confirmed' }
    });

    console.log(`[WEBHOOK] ${result.count} bookings confirmed for ${metadata.customerEmail}`);

    // Fetch the updated bookings to send notifications and schedule reminders
    const confirmedBookings = await prisma.booking.findMany({
      where: { groupId: groupId },
      include: {
        customer: true,
        studio: {
          include: {
            location: true
          }
        }
      }
    });

    const settings = await prisma.notificationSetting.findUnique({ where: { id: "default" } });
    const reminderHours = settings?.reminderHours || 24;

    // Send confirmations and schedule reminders without blocking the webhook response
    Promise.all(confirmedBookings.map(async (booking) => {
      try {
        await sendConfirmation(booking, booking.customer, booking.studio, booking.studio.location);
        
        await prisma.booking.update({
          where: { id: booking.id },
          data: { confirmationSent: true }
        });

        const reminderTime = new Date(booking.startTime.getTime() - reminderHours * 60 * 60 * 1000);
        if (reminderTime > new Date()) {
          await scheduleReminder(booking.id, booking.startTime, reminderHours);
        }
      } catch (error) {
        console.error(`Error processing notifications for booking ${booking.id}:`, error);
      }
    })).catch(console.error);
  }

  return new NextResponse(null, { status: 200 });
}
