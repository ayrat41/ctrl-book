import prisma from "@/lib/prisma";
import { format } from "date-fns";
import PromoRuleModal from "@/components/admin/PromoRuleModal";
import DeletePromoButton from "@/components/admin/DeletePromoButton";
import { Tag, CalendarDays, Repeat, Circle, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const [rules, studios, locations] = await Promise.all([
    prisma.pricingRule.findMany({
      orderBy: { validFrom: "asc" },
      include: { targetLocation: true },
    }),
    prisma.studio.findMany({
      select: { id: true, name: true, roomId: true, locationId: true },
    }),
    prisma.location.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-end">
        <PromoRuleModal mode="CREATE" studios={studios} locations={locations} />
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden shadow-sm flex flex-col">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-black/5 dark:bg-brand-latte/5 text-xs uppercase font-semibold opacity-60">
            <tr>
              <th className="px-6 py-4 font-semibold text-center w-12"></th>
              <th className="px-6 py-4 font-semibold">Rule Name</th>
              <th className="px-6 py-4 font-semibold">Condition</th>
              <th className="px-6 py-4 font-semibold">Adjustment</th>
              <th className="px-6 py-4 font-semibold">Scope</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center opacity-50 font-medium italic"
                >
                  No pricing templates active.
                </td>
              </tr>
            ) : (
              rules.map((r) => {
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-brand-black/[0.02] dark:hover:bg-white/[0.02] transition-colors relative group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        {r.ruleType === "SPECIAL" ? (
                          <CalendarDays className="w-5 h-5 text-brand-blue" />
                        ) : (
                          <Repeat className="w-5 h-5 text-brand-jasmine" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-base">{r.name}</div>
                      <div className="text-[10px] opacity-40 uppercase tracking-wider font-mono">
                        {r.ruleType} • {r.id.split("-")[0]}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {r.ruleType === "SPECIAL" ? (
                        <div className="text-xs font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded inline-block">
                          {r.validFrom
                            ? format(new Date(r.validFrom), "MMM d, yyyy")
                            : "?"}{" "}
                          -{" "}
                          {r.validTo
                            ? format(new Date(r.validTo), "MMM d, yyyy")
                            : "?"}
                        </div>
                      ) : (
                        <div className="text-xs font-mono opacity-80 flex gap-1 items-center">
                          {r.daysOfWeek.length > 0
                            ? r.daysOfWeek.join(",")
                            : "Any day"}
                          <span className="opacity-50 mx-1">•</span>
                          {r.startHour != null
                            ? `${r.startHour}:00`
                            : "00:00"}{" "}
                          - {r.endHour != null ? `${r.endHour}:00` : "23:59"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-mono bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-jasmine inline-block px-2 py-1 rounded-md text-xs font-bold">
                        {r.adjustmentType === "percentage" &&
                          `${r.adjustmentValue > 0 ? "+" : ""}${r.adjustmentValue}%`}
                        {r.adjustmentType === "fixed_amount" &&
                          `${r.adjustmentValue > 0 ? "+$" : "-$"}${Math.abs(r.adjustmentValue)}`}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                        <Globe className="w-3 h-3" />
                        Global Protocol
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PromoRuleModal
                          mode="EDIT"
                          initialData={r}
                          studios={studios}
                          locations={locations}
                        />
                        <DeletePromoButton id={r.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
