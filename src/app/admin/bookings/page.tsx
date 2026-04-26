import prisma from "@/lib/prisma";
import BookingsClient from "./BookingsClient";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { startTime: "desc" },
    include: {
      customer: true,
      studio: { include: { location: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl  tracking-tight">Reservations</h1>
        <p className="text-neutral-500 font-medium">
          Manage client bookings, cancellations, and refunds.
        </p>
      </div>

      <BookingsClient initialBookings={bookings} />
    </div>
  );
}
