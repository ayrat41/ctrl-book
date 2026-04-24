"use client";

import { useState } from "react";
import { updateLocationPricing } from "@/app/admin/locations/actions";
import { ShieldAlert, Save } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { cn } from "@/lib/utils";

export default function LocationSettingsForm({ location }: { location: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.append("id", location.id);
    
    const result = await updateLocationPricing(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-4">
         <h2 className="text-xl font-bold">Location Settings</h2>
         <button
            type="submit"
            disabled={isSubmitting}
            className={cn(Theme.classes.primaryButton, "w-auto px-6 py-2 text-sm flex items-center gap-2")}
         >
            <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
         </button>
      </div>

      {message && (
        <div className={cn("p-4 rounded-xl text-sm font-bold", message.type === 'success' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Base Hourly Rate ($)</label>
          <input name="basePrice" type="number" step="0.01" defaultValue={location.basePrice} required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-red-500">Min Price Floor ($)</label>
          <input name="minPriceFloor" type="number" step="0.01" defaultValue={location.minPriceFloor} required className="w-full px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 focus:border-red-500 outline-none transition-all font-mono font-bold text-red-600 dark:text-red-400" />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Operating Days</label>
          <div className="flex gap-2 h-12">
            {[
              { label: "Mon", val: 1 },
              { label: "Tue", val: 2 },
              { label: "Wed", val: 3 },
              { label: "Thu", val: 4 },
              { label: "Fri", val: 5 },
              { label: "Sat", val: 6 },
              { label: "Sun", val: 0 },
            ].map((day) => (
              <label key={day.val} className="flex-1 cursor-pointer group">
                <input
                  type="checkbox"
                  name="availableDays"
                  value={day.val}
                  defaultChecked={location.availableDays.includes(day.val)}
                  className="sr-only peer"
                />
                <div className="w-full h-full flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                  {day.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Available Hours</label>
          <div className="grid grid-cols-6 gap-2">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
              <label key={hour} className="cursor-pointer group">
                <input
                  type="checkbox"
                  name="availableHours"
                  value={hour}
                  defaultChecked={location.availableHours.includes(hour)}
                  className="sr-only peer"
                />
                <div className="w-full py-3 flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs font-bold border border-transparent peer-checked:border-brand-blue shadow-sm">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
