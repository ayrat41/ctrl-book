import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

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
    const timeSlots = JSON.parse(metadata.timeSlots);
    const addOns = JSON.parse(metadata.addOns);

    // 1. Create or Update Customer
    const customer = await prisma.customer.upsert({
      where: { email: metadata.customerEmail },
      update: { fullName: metadata.customerName },
      create: {
        email: metadata.customerEmail,
        fullName: metadata.customerName,
      },
    });

    // 2. Create Bookings (one for each slot)
    const groupId = session.id; // Group related slots by Stripe session ID

    for (const slot of timeSlots) {
        // Calculate price for each slot again or use metadata if passed
        // For now, we divide the total if needed or just use the base metrics
        // In a real app, you might want to store individual slot prices in metadata
        
        await prisma.booking.create({
            data: {
                startTime: new Date(slot.start),
                endTime: new Date(slot.end),
                studioId: metadata.studioId,
                customerId: customer.id,
                finalPrice: session.amount_total / 100 / timeSlots.length, // Rough average for now
                status: 'confirmed',
                addOns: addOns,
                groupId: groupId
            }
        });
    }

    console.log(`[WEBHOOK] Booking created for ${metadata.customerEmail}`);
  }

  return new NextResponse(null, { status: 200 });
}
