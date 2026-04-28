import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      bookings: {
        where: { status: "confirmed" },
        select: {
          finalPrice: true,
          startTime: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedCustomers = customers.map((c) => {
    const totalRevenue = c.bookings.reduce((sum, b) => sum + b.finalPrice, 0);
    const bookingCount = c.bookings.length;
    const lastBooking =
      c.bookings.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime(),
      )[0]?.startTime || null;

    return {
      ...c,
      totalRevenue,
      bookingCount,
      lastBooking,
    };
  });

  return <CustomersClient initialCustomers={formattedCustomers as any} />;
}
