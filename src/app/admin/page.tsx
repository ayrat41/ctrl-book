import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { DollarSign, Library, Users, TrendingUp } from "lucide-react";

import DashboardCalendar from "@/components/admin/DashboardCalendar";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Parallel Data Fetching
  const [bookings, totalRevenue, totalStudios, recentBookings] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { finalPrice: true } }),
      prisma.studio.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { startTime: "desc" },
        include: {
          customer: true,
          studio: { include: { location: true } },
        },
      }),
    ]);

  const revenue = totalRevenue._sum.finalPrice || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-60">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl  tracking-tighter">
            $
            {revenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-60">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
              <Library className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl  tracking-tighter">{bookings}</div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-60">Operations</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl  tracking-tighter">
            {totalStudios}{" "}
            <span className="text-base font-medium opacity-50">studios</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold opacity-60">Customers</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl  tracking-tighter">--</div>
        </div>
      </div>

      {/* Calendar Dashboard */}
      <DashboardCalendar />

      {/* Recent Bookings Table */}
      <div className="space-y-4">
        <h2 className="text-xl ">Recent Bookings</h2>
        <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden shadow-sm flex flex-col">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-black/5 dark:bg-brand-latte/5 text-xs uppercase font-semibold opacity-60">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Studio</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center opacity-50 font-medium italic"
                  >
                    No recent bookings found.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-brand-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      {b.customer.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{b.studio.name}</div>
                      <div className="text-xs opacity-60">
                        {b.studio.location.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {format(b.startTime, "MMM d, yyyy")}
                      </div>
                      <div className="text-xs opacity-60">
                        {format(b.startTime, "h:mm a")} -{" "}
                        {format(b.endTime, "h:mm a")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px]  uppercase tracking-wider bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right  font-mono">
                      ${b.finalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
