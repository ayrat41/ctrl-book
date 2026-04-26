import WidgetFlow from "@/components/ui/WidgetFlow";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function WidgetPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative">
      <Link
        href="/admin/schedule-management"
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-brand-latte/5 rounded-full hover:bg-brand-black/10 dark:hover:bg-white/10 transition-colors text-black/50 dark:text-white/50 hover:text-black dark:hover:text-brand-latte  text-sm tracking-wider uppercase group"
      >
        <Settings className="w-4 h-4 transition-transform group-hover:rotate-90" />
        <span className="hidden sm:inline">Management</span>
      </Link>
      <WidgetFlow />
    </main>
  );
}
