import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, studioId, timeSlots, addOns, finalPrice } = body;

    if (!customerId || !studioId || !Array.isArray(timeSlots) || timeSlots.length === 0 || finalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Pass 1: Validate ALL time slots are open before creating any
    for (const slot of timeSlots) {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      
      const overlappingBookings = await prisma.booking.count({
        where: {
           studioId: studioId,
           status: { in: ['pending', 'confirmed'] },
           OR: [
             { startTime: { lt: end, gte: start } },
             { endTime: { gt: start, lte: end } }
           ]
        }
      });

      if (overlappingBookings > 0) {
        return NextResponse.json({ error: `Time slot starting at ${start.toISOString()} is no longer available` }, { status: 409 });
      }
    }

    // Pass 2: Create all bookings under a cohesive cart ID
    const groupId = crypto.randomUUID();
    const splitPrice = finalPrice / timeSlots.length; // split final cart cost among individual slots
    const addOnsArray = Array.isArray(addOns) ? addOns : [];

    const createdBookings = [];

    for (const slot of timeSlots) {
       const start = new Date(slot.start);
       const end = new Date(slot.end);

       const booking = await prisma.booking.create({
         data: {
           customerId,
           studioId,
           startTime: start,
           endTime: end,
           finalPrice: splitPrice,
           addOns: addOnsArray,
           groupId: groupId,
           status: 'pending', // Temporary lock until payment confirmation
         }
       });
       createdBookings.push(booking);
    }

    return NextResponse.json({ groupId, bookings: createdBookings }, { status: 201 });
  } catch (error) {
    console.error('Error creating pending bookings:', error);
    return NextResponse.json({ error: 'Failed to create booking cart' }, { status: 500 });
  }
}
