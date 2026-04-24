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
  customerPhone?: string;
  // Marketing attribution
  promoCodeId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.");
    }
    const {
      studioId,
      locationId,
      timeSlots,
      addOns,
      customerEmail,
      customerName,
      customerPhone,
      promoCodeId,
      utmSource,
      utmMedium,
      utmCampaign,
    } = params;

    // 1. Recalculate prices on server for security
    let totalCents = 0;
    const slotDetails = [];

    for (const slot of timeSlots) {
      const pricing = await getEffectivePrice(locationId, studioId, new Date(slot.start));
      totalCents += Math.round(pricing.finalPrice * 100);
      slotDetails.push({
        start: slot.start,
        end: slot.end,
        price: pricing.finalPrice,
      });
    }

    for (const addon of addOns) {
      // For simplicity in this version, we trust the client addon price,
      // but in production we should fetch from DB
      totalCents += Math.round(addon.price * 100);
    }

    // 2. Apply promo code discount if provided
    let promoRule = null;
    if (promoCodeId) {
      promoRule = await prisma.pricingRule.findUnique({ where: { id: promoCodeId } });
      if (promoRule && promoRule.isActive) {
        const baseTotal = totalCents / 100;
        let discountedTotal = baseTotal;

        if (promoRule.adjustmentType === "percentage") {
          discountedTotal = baseTotal * (1 + promoRule.adjustmentValue / 100);
        } else if (promoRule.adjustmentType === "fixed_amount") {
          discountedTotal = baseTotal + promoRule.adjustmentValue;
        } else if (promoRule.adjustmentType === "fixed_override") {
          discountedTotal = promoRule.adjustmentValue;
        }

        // Clamp to prevent negative totals
        totalCents = Math.max(0, Math.round(discountedTotal * 100));
      }
    }

    if (totalCents <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    // 3. Create or Find Customer
    const customer = await prisma.customer.upsert({
      where: { email: customerEmail },
      update: { fullName: customerName, phone: customerPhone },
      create: {
        email: customerEmail,
        fullName: customerName,
        phone: customerPhone,
      },
    });

    // 4. Create Pending Bookings to lock the slots
    const groupId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const splitPrice = totalCents / 100 / timeSlots.length;
    const addOnsArray = addOns.map((a) => a.id);

    await Promise.all(
      timeSlots.map((slot) =>
        prisma.booking.create({
          data: {
            customerId: customer.id,
            studioId: studioId,
            startTime: new Date(slot.start),
            endTime: new Date(slot.end),
            finalPrice: splitPrice,
            addOns: addOnsArray,
            groupId: groupId,
            status: "pending",
            // Marketing attribution
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            pricingRuleId: promoCodeId || null,
          },
        }),
      ),
    );

    // 5. Create Stripe Checkout Session
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
        groupId,
        timeSlots: JSON.stringify(timeSlots),
        addOns: JSON.stringify(addOnsArray),
        promoCodeId: promoCodeId || "",
      },
    });

    // 6. Increment promo currentUses if a promo was applied
    if (promoRule) {
      await prisma.pricingRule.update({
        where: { id: promoRule.id },
        data: { currentUses: { increment: 1 } },
      });
    }

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error("[STRIPE] Error creating session:", error);
    return { error: error.message };
  }
}

