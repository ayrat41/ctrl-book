"use client";

import { useState } from "react";
import { Settings2, X, ShieldAlert } from "lucide-react";
import { updateLocationPricing } from "@/app/admin/locations/actions";

interface LocationObj {
  id: string;
  name: string;
  basePrice: number;
  minPriceFloor: number;
}

export default function EditLocationPricingModal({ location }: { location: LocationObj }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", location.id);
    
    const result = await updateLocationPricing(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-black/10 dark:border-white/10 hover:bg-brand-black/5 dark:hover:bg-white/5 active:scale-95 transition-all rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
      >
        <Settings2 className="w-4 h-4" /> Rates & Limits
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center text-neutral-900 dark:text-brand-latte">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                   <h2 className="text-xl font-black tracking-tight">{location.name} Pricing</h2>
                   <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-tight">Master Hierarchical Engine Limits</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 text-neutral-900 dark:text-brand-latte">
               
               <div className="p-4 rounded-xl bg-brand-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                 <h4 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2 text-brand-blue dark:text-brand-jasmine flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> WARNING</h4>
                 <p className="text-xs opacity-60 leading-relaxed font-medium">Modifying these hard limits will immediately govern all dynamic prices calculated moving forward, restricting maximum allowed discounts globally for this location.</p>
               </div>

               <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Base Hourly Rate ($)</label>
                    <input name="basePrice" type="number" step="0.01" defaultValue={location.basePrice} required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 text-red-500">Min Price Floor ($)</label>
                    <input name="minPriceFloor" type="number" step="0.01" defaultValue={location.minPriceFloor} required className="w-full px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 focus:border-red-500 outline-none transition-all font-mono font-bold text-red-600 dark:text-red-400" />
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Operating Days</label>
                    <div className="flex gap-1.5 h-10">
                      {[
                        { label: "Mon", val: 1 },
                        { label: "Tue", val: 2 },
                        { label: "Wed", val: 3 },
                        { label: "Thu", val: 4 },
                        { label: "Fri", val: 5 },
                        { label: "Sat", val: 6 },
                        { label: "Sun", val: 0 },
                      ].map((day) => (
                        <label
                          key={day.val}
                          className="flex-1 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            name="availableDays"
                            value={day.val}
                            defaultChecked={location.availableDays.includes(day.val)}
                            className="sr-only peer"
                          />
                          <div className="w-full h-full flex items-center justify-center rounded-lg bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-[9px] font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                            {day.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Available Hours (9 AM - 8 PM)</label>
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
                          <div className="w-full py-1.5 flex items-center justify-center rounded-lg bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-[9px] font-bold border border-transparent peer-checked:border-brand-blue shadow-sm">
                            {hour > 12 ? `${hour - 12}P` : hour === 12 ? "12P" : `${hour}A`}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 mt-4 bg-brand-blue text-brand-latte font-black rounded-2xl shadow-xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-sm uppercase tracking-widest"
               >
                  {isSubmitting ? "SYNCING LIMITS..." : "Update Engine Bounds"}
               </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
