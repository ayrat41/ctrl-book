import Link from "next/link";
import Image from "next/image";
import { CalendarDays, LayoutDashboard } from "lucide-react";

export default function HomeGateway() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-brand-yellow font-sans dark:bg-[#0a0a0a] p-4 sm:p-8">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-brand-blue/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <main className="z-10 flex flex-col items-center w-full max-w-4xl text-center space-y-12">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-brand-yellow dark:bg-brand-black rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 overflow-hidden">
            <Image
              src="/brand-star.png"
              alt="Ctrl & Snap Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl  tracking-tight text-neutral-900 dark:text-brand-latte">
            CTRL&BOOK
          </h1>
          <p className="text-lg text-neutral-500 font-medium max-w-lg mx-auto">
            Choose your destination environment. Access the customer-facing
            booking portal or manage your studio via the admin dashboard.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <Link href="/widget" className="group">
            <div className="h-full flex flex-col items-center p-8 sm:p-12 rounded-[2rem] bg-white/60 dark:bg-brand-latte/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h2 className="text-2xl  mb-2">Booking Widget</h2>
              <p className="text-neutral-500 text-sm font-medium">
                Headless booking interface designed for customers.
              </p>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="h-full flex flex-col items-center p-8 sm:p-12 rounded-[2rem] bg-white/60 dark:bg-brand-latte/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-jasmine flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h2 className="text-2xl  mb-2">Admin Dashboard</h2>
              <p className="text-neutral-500 text-sm font-medium">
                Operational overview, backend tables, and stats.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
