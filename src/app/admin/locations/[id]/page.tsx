import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import LocationSettingsForm from "./LocationSettingsForm";
import StudioSettingsRow from "./StudioSettingsRow";
import NewStudioModal from "@/components/admin/NewStudioModal";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import DeleteLocationButton from "../DeleteLocationButton";

export const dynamic = "force-dynamic";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      address: true,
      studios: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!location) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/admin/locations"
        className="text-sm  text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 w-fit transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Locations
      </Link>

      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl  tracking-tight">{location.name}</h1>
          <p className="text-neutral-500 font-medium text-sm">
            {location.address.streetLine1}, {location.address.city},{" "}
            {location.address.state} {location.address.zipCode}
          </p>
        </div>
        <DeleteLocationButton id={location.id} name={location.name} />
      </div>

      <div className="mt-8 space-y-12">
        <section>
          <LocationSettingsForm location={location} />
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-4">
            <h2 className="text-2xl  tracking-tight">Studios</h2>
            <NewStudioModal locationId={location.id} />
          </div>

          {location.studios.length === 0 ? (
            <p className="text-neutral-500 text-sm italic">
              No studios configured for this location.
            </p>
          ) : (
            <div className="space-y-4">
              {location.studios.map((studio) => (
                <StudioSettingsRow key={studio.id} studio={studio} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
