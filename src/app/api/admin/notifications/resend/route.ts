import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendConfirmation, sendReminder, sendCancellation, sendReschedule } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const { logId } = await req.json();
    
    const log = await prisma.notificationLog.findUnique({
      where: { id: logId },
      include: {
        booking: {
          include: {
            customer: true,
            studio: {
              include: {
                location: true
              }
            }
          }
        }
      }
    });

    if (!log || !log.booking) {
      return new NextResponse("Log or Booking not found", { status: 404 });
    }

    const { booking } = log;
    const { customer, studio } = booking;

    // Trigger the appropriate notification based on the log type
    switch (log.type) {
      case 'confirmation':
        await sendConfirmation([booking], customer);
        break;
      case 'reminder':
        await sendReminder(booking, customer, studio, studio.location);
        break;
      case 'cancellation':
        await sendCancellation(booking, customer, studio, studio.location);
        break;
      case 'reschedule':
        await sendReschedule(booking, customer, studio, studio.location);
        break;
      default:
        return new NextResponse("Unknown notification type", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[NOTIFICATION_RESEND_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
