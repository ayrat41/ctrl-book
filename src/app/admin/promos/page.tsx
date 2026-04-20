import prisma from "@/lib/prisma";
import { format } from "date-fns";
import NewPromoButton from "@/components/admin/NewPromoButton";
import { Tag, CalendarDays, Repeat, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const [rules, studios, locations] = await Promise.all([
    prisma.pricingRule.findMany({
      orderBy: { validFrom: "asc" },
      include: {
        targetLocation: true,
        targetStudio: true
      }
    }),
    prisma.studio.findMany({ select: { id: true, name: true, type: true } }),
    prisma.location.findMany({ select: { id: true, name: true } })
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">Price Templates</h1>
          <p className="text-neutral-500 font-medium">Manage hierarhical price rules, specials, and recurring conditions.</p>
        </div>
        <NewPromoButton studios={studios} locations={locations} />
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden shadow-sm flex flex-col">
         <table className="w-full text-left text-sm">
           <thead className="bg-brand-black/5 dark:bg-brand-latte/5 text-xs uppercase font-semibold opacity-60">
             <tr>
               <th className="px-6 py-4 font-semibold">Rule Name</th>
               <th className="px-6 py-4 font-semibold">Type</th>
               <th className="px-6 py-4 font-semibold">Condition</th>
               <th className="px-6 py-4 font-semibold">Adjustment</th>
               <th className="px-6 py-4 font-semibold">Target Scope</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center opacity-50 font-medium italic">No pricing templates active.</td>
                </tr>
              ) : (
                rules.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-brand-black/[0.02] dark:hover:bg-white/[0.02] transition-colors relative">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <Circle className="w-3 h-3 fill-current" style={{ color: r.colorCode || '#F5D650' }} />
                             <span className="font-bold">{r.name}</span>
                          </div>
                          <div className="text-[10px] opacity-40 ml-6 uppercase mt-0.5 tracking-wider font-mono">{r.id.split('-')[0]}</div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             {r.ruleType === "SPECIAL" ? <CalendarDays className="w-4 h-4 opacity-50" /> : <Repeat className="w-4 h-4 opacity-50" />}
                             <span className="font-bold text-xs uppercase tracking-wider bg-brand-black/5 dark:bg-white/5 px-2 py-1 rounded-md">{r.ruleType}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          {r.ruleType === "SPECIAL" ? (
                             <div className="text-xs font-mono opacity-80">
                               {r.validFrom ? format(r.validFrom, "MMM d, yyyy") : "?"} - {r.validTo ? format(r.validTo, "MMM d, yyyy") : "?"}
                             </div>
                          ) : (
                             <div className="text-xs font-mono opacity-80 flex gap-1 items-center">
                               {r.daysOfWeek.length > 0 ? r.daysOfWeek.join(',') : "Any day"} 
                               <span className="opacity-50 mx-1">•</span> 
                               {r.startHour != null ? `${r.startHour}:00` : "*"} - {r.endHour != null ? `${r.endHour}:00` : "*"}
                             </div>
                          )}
                       </td>
                       <td className="px-6 py-5">
                          <div className="font-mono bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-jasmine inline-block px-2 py-1 rounded-md text-xs font-bold">
                             {r.adjustmentType === "percentage" && `${r.adjustmentValue > 0 ? '+' : ''}${r.adjustmentValue}%`}
                             {r.adjustmentType === "fixed_amount" && `${r.adjustmentValue > 0 ? '+$' : '-$'}${Math.abs(r.adjustmentValue)} SLOT`}
                             {r.adjustmentType === "fixed_override" && `SET TO $${r.adjustmentValue}`}
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="font-medium">{r.targetLocation ? r.targetLocation.name : "Global Protocol"}</div>
                          {r.targetStudio && <div className="text-xs opacity-60">Studio Filter: {r.targetStudio.name}</div>}
                       </td>
                    </tr>
                  )
                })
              )}
           </tbody>
         </table>
      </div>
    </div>
  );
}
