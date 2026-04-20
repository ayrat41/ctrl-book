import prisma from "@/lib/prisma";
import EditStudioModal from "@/components/admin/EditStudioModal";
import EditLocationPricingModal from "@/components/admin/EditLocationPricingModal";
import NewLocationModal from "@/components/admin/NewLocationModal";
import NewStudioModal from "@/components/admin/NewStudioModal";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    include: {
      address: true,
      studios: {
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">
            Locations & Studios
          </h1>
          <p className="text-neutral-500 font-medium">
            Manage your physical addresses and adjust studio pricing metrics.
          </p>
        </div>
        <NewLocationModal />
      </div>

      <div className="space-y-8 mt-8">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-brand-black/[0.02] dark:bg-brand-latte/[0.02] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{loc.name}</h2>
                <p className="text-sm opacity-60 mt-1">
                  {loc.address.streetLine1}, {loc.address.city},{" "}
                  {loc.address.state} {loc.address.zipCode}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-4">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-40">
                    Base / Floor
                  </span>
                  <span className="font-mono font-bold">
                    ${loc.basePrice} /{" "}
                    <span className="text-red-500 dark:text-red-400 font-black">
                      ${loc.minPriceFloor}
                    </span>
                  </span>
                </div>
                <EditLocationPricingModal
                  location={{
                    id: loc.id,
                    name: loc.name,
                    basePrice: loc.basePrice,
                    minPriceFloor: loc.minPriceFloor,
                  }}
                />
                <NewStudioModal locationId={loc.id} />
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4">
                Studios
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loc.studios.map((studio) => (
                  <div
                    key={studio.id}
                    className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-brand-latte/[0.02] transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {studio.name}
                          {studio.type && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-brand-blue/10 text-brand-blue rounded uppercase font-black">
                              {studio.type}
                            </span>
                          )}
                        </div>
                        {studio.roomId && (
                          <div className="text-[10px] uppercase font-bold opacity-30 tracking-tight mt-0.5">
                            Room: {studio.roomId}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                        Cap: {studio.maxCapacity}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-60">Pricing Model</span>
                        <span className="font-bold font-mono text-brand-blue dark:text-brand-jasmine text-xs">
                          Dynamic Rate
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-60">Session Duration</span>
                        <span className="font-bold font-mono">
                          {studio.sessionDuration} mins
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                      <EditStudioModal studio={studio} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
