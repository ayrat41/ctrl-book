import prisma from "@/lib/prisma";
import StudioRegistry from "@/components/admin/StudioRegistry";

export const dynamic = "force-dynamic";

export default async function StudiosPage() {
  const [locations, studios] = await Promise.all([
    prisma.location.findMany({ select: { id: true, name: true } }),
    prisma.studio.findMany({ 
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        roomId: true,
        sessionDuration: true,
        maxCapacity: true,
        locationId: true
      }
    })
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
           Studio Management
        </h1>
        <p className="text-neutral-500 font-medium">Define your catalog of rooms and specials. These become the modes available in your operational calendar.</p>
      </div>

      <div className="pt-8">
        <StudioRegistry 
          locations={locations}
          studios={studios}
        />
      </div>
    </div>
  );
}
