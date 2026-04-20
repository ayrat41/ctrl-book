"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-latte dark:bg-brand-black shadow-2xl flex items-center justify-center opacity-50 border border-black/10 dark:border-white/10" />
    );
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-latte dark:bg-[#111] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-black/10 dark:border-white/10 group overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Sun Icon (Rotates OUT when dark) */}
        <Sun 
          className={`absolute w-6 h-6 text-brand-jasmine transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`} 
        />
        
        {/* Moon Icon (Rotates IN when dark) */}
        <Moon 
          className={`absolute w-6 h-6 text-brand-blue transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark ? "scale-100 rotate-0 opacity-100 text-brand-jasmine" : "-rotate-90 scale-0 opacity-0"
          }`} 
        />
      </div>
    </button>
  );
}
