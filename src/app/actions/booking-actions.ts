"use server";

import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { getEffectivePrice } from "@/lib/pricing";

export async function createCheckoutSession(params: {
  studioId: string;
  locationId: string;
  timeSlots: { start: string; end: string; studioId?: string }[];
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

    // Fetch promo rule if provided
    let promoRule = null;
    if (promoCodeId) {
      promoRule = await prisma.pricingRule.findUnique({ where: { id: promoCodeId } });
    }

    for (const slot of timeSlots) {
      const slotStart = new Date(slot.start);
      const currentStudioId = slot.studioId || studioId;
      const pricing = await getEffectivePrice(locationId, currentStudioId, slotStart);
      
      let finalSlotPrice = pricing.finalPrice;

      // Apply promo discount to this specific slot if valid for this date
      if (promoRule && promoRule.isActive) {
        const isDateValid = (!promoRule.validFrom || slotStart >= promoRule.validFrom) && 
                            (!promoRule.validTo || slotStart <= promoRule.validTo);
        
        if (isDateValid) {
          let disc = 0;
          if (promoRule.adjustmentType === "percentage") {
            disc = finalSlotPrice * (Math.abs(Number(promoRule.adjustmentValue)) / 100);
          } else if (promoRule.adjustmentType === "fixed_amount") {
            disc = Math.abs(Number(promoRule.adjustmentValue));
          }

          // Ensure floor compliance
          const maxDisc = Math.max(0, finalSlotPrice - pricing.floor);
          finalSlotPrice -= Math.min(disc, maxDisc);
        }
      }

      totalCents += Math.round(finalSlotPrice * 100);
      slotDetails.push({
        start: slot.start,
        end: slot.end,
        price: finalSlotPrice,
      });
    }

    for (const addon of addOns) {
      totalCents += Math.round(addon.price * 100);
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
            studioId: slot.studioId || studioId,
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === "production" ? "https://sbsce3vy25.us-east-1.awsapprunner.com" : "http://localhost:3000");

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
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/widget`,
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

export async function createAdminBooking(params: {
  studioId: string;
  locationId: string;
  timeSlots: { start: string; end: string }[];
  customerId: string;
  addOns?: string[];
}) {
  try {
    const { studioId, locationId, timeSlots, customerId, addOns = [] } = params;

    // 1. Check if customer is blacklisted
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.isBlacklisted) {
      throw new Error("Cannot book for blacklisted customers");
    }

    // 2. Calculate prices
    let totalRevenue = 0;
    const bookingsData = [];

    for (const slot of timeSlots) {
      const pricing = await getEffectivePrice(locationId, studioId, new Date(slot.start));
      totalRevenue += pricing.finalPrice;
      
      bookingsData.push({
        customerId,
        studioId,
        startTime: new Date(slot.start),
        endTime: new Date(slot.end),
        finalPrice: pricing.finalPrice,
        addOns,
        status: "confirmed", // Admin bookings are confirmed immediately
        groupId: `admin_${Date.now()}`,
      });
    }

    // 3. Create bookings
    await prisma.$transaction(
      bookingsData.map((data) => prisma.booking.create({ data }))
    );

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/schedule-management");
    
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN BOOKING] Error:", error);
    return { success: false, error: error.message };
  }
}
