"use client";

import { useState } from "react";
import { GlobalSettings } from "@prisma/client";
import { Save, CalendarDays, Undo2, Ban } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { cn } from "@/lib/utils";
import { updateGlobalSettings } from "../settings/settings-actions";

export default function ScheduleRulesClient({
  initialSettings,
}: {
  initialSettings: GlobalSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGlobalSettings(settings);
      alert("Schedule rules saved successfully!");
    } catch (e) {
      alert("Error saving rules.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={cn(Theme.classes.cardGlass, "p-8")}>
        <div className="grid gap-10">
          {/* Cancellation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400">
              <Ban className="w-4 h-4" />
              Cancellation Policy
            </div>
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Limit cancellation to (Hours before)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="w-32 p-4 rounded-2xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all text-lg font-mono"
                    value={settings.cancellationWindowHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cancellationWindowHours: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="opacity-50 font-medium">Hours</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed italic border-l-2 border-brand-yellow/30 pl-4">
                Customers cannot cancel their session if it starts in less than
                this amount of hours.
              </p>
            </div>
          </div>

          <hr className="border-black/5 dark:border-white/5" />

          {/* Reschedule */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400">
              <Undo2 className="w-4 h-4" />
              Rescheduling Terms
            </div>

            <div className="grid sm:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Free Reschedule Period (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="w-32 p-4 rounded-2xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all text-lg font-mono"
                    value={settings.rescheduleWindowHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        rescheduleWindowHours: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="opacity-50 font-medium">Hours</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Late Reschedule Fee ($)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-30">$</span>
                  <input
                    type="number"
                    className="w-full p-4 rounded-2xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all text-lg font-mono"
                    value={settings.rescheduleFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        rescheduleFee: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl"
          >
            {saving ? "Processing..." : "Save Rules"}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
