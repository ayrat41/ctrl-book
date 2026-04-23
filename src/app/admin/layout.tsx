import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Tag,
  Settings,
  LogOut,
  Clock,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent text-neutral-900 dark:text-neutral-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-2xl flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6">
          <div className="font-black text-brand-blue text-2xl tracking-tighter dark:text-brand-yellow">
            CTRL&BOOK
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mt-1">
            Workspace
          </p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-black/5 dark:bg-white/10 font-medium text-sm text-neutral-900 dark:text-brand-latte transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Bookings
          </Link>
          <Link
            href="/admin/schedule-management"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Clock className="w-4 h-4" /> Schedule Management
          </Link>
          <Link
            href="/admin/studios"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Zap className="w-4 h-4" /> Studio Management
          </Link>
          <Link
            href="/admin/locations"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Locations & Studios
          </Link>
          <Link
            href="/admin/promos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Tag className="w-4 h-4" /> Price Controls
          </Link>
          <Link
            href="/admin/addons"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Tag className="w-4 h-4" /> Add-ons
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <Users className="w-4 h-4" /> Customers
          </Link>
        </nav>

        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-black/5 dark:hover:bg-white/5 font-medium text-sm text-neutral-600 dark:text-neutral-400 transition-colors mb-1"
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Exit to Root
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar Header */}
        <header className="h-16 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-8">
          <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Overview
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-jasmine to-brand-blue shadow-inner flex items-center justify-center text-brand-latte font-bold text-xs">
              A
            </div>
          </div>
        </header>

        {/* Page Content Injection */}
        <div className="p-8 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
