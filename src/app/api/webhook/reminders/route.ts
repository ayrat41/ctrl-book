import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import prisma from '@/lib/prisma';
import { sendReminder } from '@/lib/notifications';

async function handler(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return new NextResponse('Missing bookingId', { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        studio: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      console.log(`Booking ${bookingId} is cancelled/refunded. Skipping reminder.`);
      return new NextResponse('Booking is cancelled or refunded', { status: 200 });
    }

    if (booking.reminder24hSent) {
      console.log(`Reminder already sent for booking ${bookingId}. Skipping.`);
      return new NextResponse('Reminder already sent', { status: 200 });
    }

    await sendReminder(booking, booking.customer, booking.studio, booking.studio.location);

    await prisma.booking.update({
      where: { id: bookingId },
      data: { reminder24hSent: true },
    });

    return new NextResponse('Reminder sent successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error processing reminder webhook:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
