import prisma from "@/lib/prisma";
import ManageReservationClient from "./ManageReservationClient";
import { notFound } from "next/navigation";
import { getGlobalSettings } from "@/app/admin/settings/settings-actions";

export default async function ManageReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [booking, globalSettings] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        studio: {
          include: {
            location: true,
          },
        },
      },
    }),
    getGlobalSettings(),
  ]);

  if (!booking) {
    notFound();
  }

  return <ManageReservationClient booking={booking} globalSettings={globalSettings} />;
}
