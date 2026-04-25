"use server";

import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (error: any) {
    console.error("[BOOKING] Error updating status:", error);
    return { success: false, error: error.message };
  }
}

export async function cancelBooking(bookingId: string, reason: string) {
  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (error: any) {
    console.error("[BOOKING] Error cancelling booking:", error);
    return { success: false, error: error.message };
  }
}

export async function refundBooking(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || !booking.stripePaymentId) {
      throw new Error("No payment record found for this booking.");
    }

    // Trigger Stripe Refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentId,
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "refunded",
        cancellationReason: `Refunded: ${refund.id}`,
      },
    });

    revalidatePath("/admin/bookings");
    return { success: true, refundId: refund.id };
  } catch (error: any) {
    console.error("[BOOKING] Error refunding booking:", error);
    return { success: false, error: error.message };
  }
}
