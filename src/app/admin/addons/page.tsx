import prisma from "@/lib/prisma";
import NewAddOnButton from "@/components/admin/NewAddOnButton";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function AddOnsPage() {
  const addons = await prisma.addOn.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">Add-ons Repository</h1>
          <p className="text-neutral-500 font-medium">Manage globally injected cart upsells and checkout modifiers.</p>
        </div>
        <NewAddOnButton />
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden shadow-sm flex flex-col">
         <table className="w-full text-left text-sm">
           <thead className="bg-brand-black/5 dark:bg-brand-latte/5 text-xs uppercase font-semibold opacity-60">
             <tr>
               <th className="px-6 py-4 font-semibold">Service Name</th>
               <th className="px-6 py-4 font-semibold">System ID</th>
               <th className="px-6 py-4 font-semibold">Price Config</th>
               <th className="px-6 py-4 font-semibold">Lifespan</th>
               <th className="px-6 py-4 font-semibold text-right">Visibility</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {addons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center opacity-50 font-medium italic">No add-ons found in database. Start by adding your first service.</td>
                </tr>
              ) : (
                addons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-brand-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                     <td className="px-6 py-4 font-bold">{addon.name}</td>
                     <td className="px-6 py-4 text-xs font-mono opacity-60">{addon.id}</td>
                     <td className="px-6 py-4 font-mono font-bold text-brand-blue dark:text-brand-jasmine">+ ${addon.price.toFixed(2)}</td>
                     <td className="px-6 py-4 text-xs opacity-60">
                        {addon.validFrom || addon.validTo ? (
                          <div className="flex flex-col gap-0.5">
                             {addon.validFrom && <div>From: {new Date(addon.validFrom).toLocaleDateString()}</div>}
                             {addon.validTo && <div>To: {new Date(addon.validTo).toLocaleDateString()}</div>}
                          </div>
                        ) : (
                          <span className="italic">Always Active</span>
                        )}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <VisibilityToggle id={addon.id} isActive={addon.isActive} />
                     </td>
                  </tr>
                ))
              )}
           </tbody>
         </table>
      </div>
    </div>
  );
}
