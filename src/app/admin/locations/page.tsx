import prisma from "@/lib/prisma";

import NewLocationModal from "@/components/admin/NewLocationModal";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
      <div className="flex justify-end">
        <NewLocationModal />
      </div>

      <div className="space-y-6 mt-8">
        {locations.map((loc) => (
          <Link
            key={loc.id}
            href={`/admin/locations/${loc.id}`}
            className="block bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:border-brand-blue/50 dark:hover:border-brand-blue/50 hover:shadow-md transition-all group"
          >
            <div className="p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl  group-hover:text-brand-blue transition-colors">
                  {loc.name}
                </h2>
                <p className="text-sm opacity-60 mt-1">
                  {loc.address.streetLine1}, {loc.address.city},{" "}
                  {loc.address.state} {loc.address.zipCode}
                </p>
                <p className="text-xs  uppercase tracking-widest opacity-40 mt-3">
                  {loc.studios.length} Studio
                  {loc.studios.length !== 1 ? "s" : ""} Configured
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase  tracking-widest opacity-40">
                    Base / Floor
                  </span>
                  <span className="font-mono ">
                    ${loc.basePrice} /{" "}
                    <span className="text-red-500 dark:text-red-400 ">
                      ${loc.minPriceFloor}
                    </span>
                  </span>
                </div>
                <div className="p-3 rounded-full bg-brand-black/5 dark:bg-brand-latte/5 group-hover:bg-brand-blue group-hover:text-brand-latte transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
