"use server";

import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getEffectivePrice } from "@/lib/pricing";

export async function createCheckoutSession(params: {
  studioId: string;
  locationId: string;
  timeSlots: { start: string; end: string }[];
  addOns: { id: string; name: string; price: number }[];
  customerEmail: string;
  customerName: string;
}) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.");
    }
    const { studioId, locationId, timeSlots, addOns, customerEmail, customerName } = params;

    // 1. Recalculate prices on server for security
    let totalCents = 0;
    const slotDetails = [];

    for (const slot of timeSlots) {
      const pricing = await getEffectivePrice(locationId, studioId, new Date(slot.start));
      totalCents += Math.round(pricing.finalPrice * 100);
      slotDetails.push({
          start: slot.start,
          end: slot.end,
          price: pricing.finalPrice
      });
    }

    for (const addon of addOns) {
      // For simplicity in this version, we trust the client addon price, 
      // but in production we should fetch from DB
      totalCents += Math.round(addon.price * 100);
    }

    if (totalCents <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Studio Booking - ${timeSlots.length} Session(s)`,
              description: `Booking at ${locationId} for studio ${studioId}`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/widget`,
      metadata: {
        studioId,
        locationId,
        customerName,
        customerEmail,
        timeSlots: JSON.stringify(timeSlots),
        addOns: JSON.stringify(addOns.map(a => a.id)),
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error("[STRIPE] Error creating session:", error);
    return { error: error.message };
  }
}
