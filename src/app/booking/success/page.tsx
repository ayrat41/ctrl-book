import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Theme } from "@/lib/theme.config";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { format } from "date-fns";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string; embedded?: string; returnUrl?: string }>;
}) {
  const params = await searchParams;
  const { session_id, embedded, returnUrl } = params;

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
            include: { location: { include: { address: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      });
    }
  } catch (error) {
    console.error("Error retrieving booking details:", error);
  }

  const getGoogleCalendarUrl = (booking: any) => {
    // Format dates as UTC YYYYMMDDTHHMMSSZ for Google Calendar
    const start = booking.startTime.toISOString().replace(/-|:|\.\d+/g, "");
    const end = booking.endTime.toISOString().replace(/-|:|\.\d+/g, "");
    const title = encodeURIComponent(`Photo Session at ${booking.studio.name}`);
    const location = encodeURIComponent(
      `${booking.studio.location.address.city}, ${booking.studio.location.address.state}`,
    );
    const details = encodeURIComponent(
      `Your self-service photo studio session at ${booking.studio.name}.`,
    );

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const getAppleCalendarUrl = (booking: any) => {
    const start = booking.startTime.toISOString().replace(/-|:|\.\d+/g, "");
    const end = booking.endTime.toISOString().replace(/-|:|\.\d+/g, "");
    const title = `Photo Session at ${booking.studio.name}`;
    const location = `${booking.studio.location.address.city}, ${booking.studio.location.address.state}`;
    const details = `Your self-service photo studio session at ${booking.studio.name}.`;

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${title}\nLOCATION:${location}\nDESCRIPTION:${details}\nEND:VEVENT\nEND:VCALENDAR`;

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
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

        <div className="bg-brand-black/5 dark:bg-white/5 rounded-3xl p-6 text-left space-y-4 w-full">
          <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4">
            <Calendar className="w-5 h-5 text-brand-blue" />
            <div className="text-xs uppercase tracking-widest opacity-40 font-bold">
              Scheduled Visits
            </div>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col bg-white dark:bg-brand-black/40 rounded-2xl p-4 shadow-sm border border-black/5 dark:border-white/5"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full overflow-x-auto no-scrollbar whitespace-nowrap">
                    <span className="text-[13px] sm:text-sm font-bold shrink-0">
                      <span className="hidden sm:inline">
                        {format(booking.startTime, "EEEE, MMMM do")}
                      </span>
                      <span className="sm:hidden">
                        {format(booking.startTime, "EEE, MMM do")}
                      </span>
                    </span>
                    <span className="text-xs opacity-30 shrink-0">•</span>
                    <span className="text-[11px] sm:text-xs opacity-80 flex items-center gap-1 font-medium bg-black/5 dark:bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                      <Clock className="w-3 h-3" />
                      {format(booking.startTime, "h:mm a")} -{" "}
                      {format(booking.endTime, "h:mm a")}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-tighter font-black  mt-3">
                    {booking.studio.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-50 text-[10px] font-medium mt-1">
                    <MapPin className="w-3 h-3" />
                    {booking.studio.location.name} —{" "}
                    {booking.studio.location.address.city},{" "}
                    {booking.studio.location.address.state}
                  </div>

                  {/* Calendar Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <a
                      href={getGoogleCalendarUrl(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-white flex items-center justify-center gap-1 bg-black/5 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 px-3 py-2 rounded-xl transition-all"
                    >
                      <Calendar className="w-3 h-3" />
                      Google
                    </a>
                    <a
                      href={getAppleCalendarUrl(booking)}
                      download={`booking-${booking.id}.ics`}
                      className="flex-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-white flex items-center justify-center gap-1 bg-black/5 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 px-3 py-2 rounded-xl transition-all"
                    >
                      <Calendar className="w-3 h-3" />
                      Apple
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs font-mono opacity-60 truncate pl-8">
              ID: {session_id}
            </div>
          )}
        </div>

        {embedded === "true" && returnUrl ? (
          <a
            href={returnUrl}
            target="_top"
            className="flex items-center justify-center gap-2 w-full py-4 bg-brand-black text-brand-latte dark:bg-brand-jasmine dark:text-brand-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Book Another Session <ArrowRight className="w-5 h-5" />
          </a>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-brand-black text-brand-latte dark:bg-brand-jasmine dark:text-brand-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Return Home <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
