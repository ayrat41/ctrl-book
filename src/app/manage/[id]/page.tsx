import prisma from "@/lib/prisma";
import ManageReservationClient from "./ManageReservationClient";
import { notFound } from "next/navigation";

export default async function ManageReservationPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      studio: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return <ManageReservationClient booking={booking} />;
}
