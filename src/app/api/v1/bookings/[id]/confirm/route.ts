import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const bookingId = p.id;
    // In a real implementation you'd receive something like paymentIntentId
    const body = await request.json().catch(() => ({}));

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (existingBooking.status === 'confirmed') {
      return NextResponse.json({ error: 'Booking is already confirmed' }, { status: 400 });
    }

    // Usually you'd verify payment intent with Stripe/Square here
    // Verify Payment Engine Call...

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
      }
    });

    // Fire webhook triggers for social bots or emails here
    
    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
  }
}
