"use client";

import { useTransition } from "react";
import { toggleAddOnVisibility } from "@/app/admin/addon-actions";
import { cn } from "@/lib/utils";

interface VisibilityToggleProps {
  id: string;
  isActive: boolean;
}

export default function VisibilityToggle({
  id,
  isActive,
}: VisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleAddOnVisibility(id, isActive);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-[10px]  uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer",
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          : "bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20",
      )}
    >
      {isPending ? "..." : isActive ? "Published" : "Hidden"}
    </button>
  );
}
