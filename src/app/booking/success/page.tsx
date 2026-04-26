import Link from "next/link";
import { CheckCircle2, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Theme } from "@/lib/theme.config";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-jasmine/30 dark:bg-brand-black text-brand-black dark:text-brand-latte font-sans">
      <div className="max-w-md w-full bg-white dark:bg-brand-latte/5 rounded-[3rem] p-8 sm:p-12 shadow-3xl border border-white/50 dark:border-white/10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-brand-blue/10 dark:bg-brand-jasmine/20 text-brand-blue dark:text-brand-jasmine rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl  tracking-tight">Booking Confirmed!</h1>
          <p className="opacity-60 text-sm font-medium">
            Your session has been successfully reserved. A confirmation email
            has been sent to you.
          </p>
        </div>

        <div className="bg-brand-black/5 dark:bg-white/5 rounded-3xl p-6 text-left space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-blue" />
            <div className="text-sm font-bold">Session Reserved</div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-blue" />
            <div className="text-sm font-bold">Studio Ready</div>
          </div>
          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              Transaction ID
            </p>
            <p className="text-xs font-mono opacity-60 truncate">
              {session_id}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-4 bg-brand-black text-brand-latte dark:bg-brand-jasmine dark:text-brand-black font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Return Home <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
