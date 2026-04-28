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
      <BookingsClient initialBookings={bookings} />
    </div>
  );
}
