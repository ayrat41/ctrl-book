import Link from "next/link";
import { CheckCircle2, Calendar, MapPin, ArrowRight, Clock } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { format } from "date-fns";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const { session_id } = await searchParams;

  let bookings: any[] = [];
  
  try {
    // 1. Fetch session from Stripe to get the metadata (groupId)
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const groupId = session.metadata?.groupId;

    if (groupId) {
      // 2. Fetch bookings using groupId
      bookings = await prisma.booking.findMany({
        where: { groupId: groupId },
        include: { 
          studio: {
            include: { location: { include: { address: true } } }
          }
        },
        orderBy: { startTime: "asc" },
      });
    }
  } catch (error) {
    console.error("Error retrieving booking details:", error);
  }

  const getGoogleCalendarUrl = (booking: any) => {
    // Format dates as UTC YYYYMMDDTHHMMSSZ for Google Calendar
    const start = booking.startTime.toISOString().replace(/-|:|\.\d+/g, '');
    const end = booking.endTime.toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(`Photo Session at ${booking.studio.name}`);
    const location = encodeURIComponent(`${booking.studio.location.address.city}, ${booking.studio.location.address.state}`);
    const details = encodeURIComponent(`Your self-service photo studio session at ${booking.studio.name}.`);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-jasmine/30 dark:bg-brand-black text-brand-black dark:text-brand-latte font-sans">
      <div className="max-w-md w-full bg-white dark:bg-brand-latte/5 rounded-[3rem] p-8 sm:p-12 shadow-3xl border border-white/50 dark:border-white/10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-brand-blue/10 dark:bg-brand-jasmine/20 text-brand-blue dark:text-brand-jasmine rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl tracking-tight">Booking Confirmed!</h1>
          <p className="opacity-60 text-sm font-medium">
            Your session has been successfully reserved. A confirmation email
            has been sent to you.
          </p>
        </div>

        <div className="bg-brand-black/5 dark:bg-white/5 rounded-3xl p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-brand-blue mt-0.5" />
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                Scheduled Visit
              </div>
              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex flex-col">
                      <span className="text-sm font-bold">
                        {format(booking.startTime, "EEEE, MMMM do")}
                      </span>
                      <span className="text-xs opacity-70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(booking.startTime, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                      </span>
                      <span className="text-[10px] uppercase tracking-tighter font-black text-brand-blue/60 mt-1">
                        {booking.studio.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-50 text-[10px] font-medium">
                        <MapPin className="w-3 h-3" />
                        {booking.studio.location.name} — {booking.studio.location.address.city}, {booking.studio.location.address.state}
                      </div>
                      <a 
                        href={getGoogleCalendarUrl(booking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-brand-blue hover:underline flex items-center gap-1 mt-2 bg-brand-blue/5 px-2 py-1 rounded-lg w-fit"
                      >
                        <Calendar className="w-3 h-3" />
                        Add to Google Calendar
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono opacity-60 truncate">
                  ID: {session_id}
                </div>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-4 bg-brand-black text-brand-latte dark:bg-brand-jasmine dark:text-brand-black  rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Return Home <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
