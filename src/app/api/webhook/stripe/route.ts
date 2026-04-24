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
    const groupId = metadata.groupId || session.id;

    // Update existing pending bookings to confirmed
    const result = await prisma.booking.updateMany({
        where: { groupId: groupId },
        data: { status: 'confirmed' }
    });

    console.log(`[WEBHOOK] ${result.count} bookings confirmed for ${metadata.customerEmail}`);
  }

  return new NextResponse(null, { status: 200 });
}
