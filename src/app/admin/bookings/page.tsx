import prisma from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { startTime: "desc" },
    include: {
      customer: true,
      studio: { include: { location: true } }
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">All Bookings</h1>
        <p className="text-neutral-500 font-medium">Complete directory of all system reservations.</p>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden shadow-sm flex flex-col">
         <table className="w-full text-left text-sm">
           <thead className="bg-brand-black/5 dark:bg-brand-latte/5 text-xs uppercase font-semibold opacity-60">
             <tr>
               <th className="px-6 py-4 font-semibold">Customer</th>
               <th className="px-6 py-4 font-semibold">Studio</th>
               <th className="px-6 py-4 font-semibold">Date & Time</th>
               <th className="px-6 py-4 font-semibold">Add-ons</th>
               <th className="px-6 py-4 font-semibold">Status</th>
               <th className="px-6 py-4 font-semibold text-right">Price</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center opacity-50 font-medium italic">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                     <td className="px-6 py-4 font-medium">
                        <div>{b.customer.fullName}</div>
                        <div className="text-xs opacity-60">{b.customer.email}</div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-medium">{b.studio.name}</div>
                        <div className="text-xs opacity-60">{b.studio.location.name}</div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-medium">{format(b.startTime, "MMM d, yyyy")}</div>
                        <div className="text-xs opacity-60">{format(b.startTime, "h:mm a")} - {format(b.endTime, "h:mm a")}</div>
                     </td>
                     <td className="px-6 py-4 text-xs font-mono">
                        {b.addOns.length > 0 ? b.addOns.join(", ") : <span className="opacity-40">None</span>}
                     </td>
                     <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine">
                          {b.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right font-bold font-mono">
                        ${b.finalPrice.toFixed(2)}
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
