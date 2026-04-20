"use client";

import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import { createPromoRule } from "@/app/admin/promo-actions";

interface NewPromoButtonProps {
  studios: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

export default function NewPromoButton({ studios, locations }: NewPromoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ruleType, setRuleType] = useState<"RECURRING" | "SPECIAL">("RECURRING");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Inject ruleType state
    formData.append("ruleType", ruleType);
    
    const result = await createPromoRule(formData);
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
        className="px-4 py-2 bg-brand-blue hover:bg-brand-jasmine text-brand-latte font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-95 text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> New Price template
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] w-full max-w-lg rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">New Price template</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 font-sans">
              
              {/* 1. THE COMMON HEADER */}
              <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                     Rule Name
                   </label>
                   <input
                     name="name"
                     required
                     placeholder="e.g. Wednesday Afternoon Slump"
                     className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-semibold"
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                        Discount (%)
                      </label>
                      <input
                        name="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="e.g. 50"
                        className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                        Rule Type
                      </label>
                      <select
                        value={ruleType}
                        onChange={(e) => setRuleType(e.target.value as "RECURRING" | "SPECIAL")}
                        className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none"
                      >
                        <option value="RECURRING">Recurring (Default)</option>
                        <option value="SPECIAL">Special Event</option>
                      </select>
                    </div>
                 </div>
              </div>

              {/* 2. THE DYNAMIC BODY */}
              <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
                 
                 {ruleType === "RECURRING" && (
                    <>
                       <div className="space-y-1.5">
                         <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                           Days of Week
                         </label>
                         <div className="flex gap-1">
                           {[
                             { label: "S", val: 0 }, { label: "M", val: 1 }, { label: "T", val: 2 }, 
                             { label: "W", val: 3 }, { label: "T", val: 4 }, { label: "F", val: 5 }, { label: "S", val: 6 }
                           ].map((day, idx) => (
                             <label key={`${day.val}-${idx}`} className="cursor-pointer group flex-1">
                               <input type="checkbox" name="daysOfWeek" value={day.val} className="hidden peer" />
                               <div className="py-2 text-center rounded-xl border border-black/10 dark:border-white/10 bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:border-brand-blue peer-checked:bg-brand-blue text-brand-black dark:text-brand-latte peer-checked:text-white transition-all shadow-sm">
                                 <div className="text-xs font-black uppercase">{day.label}</div>
                               </div>
                             </label>
                           ))}
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              Time Window (Start)
                            </label>
                            <select name="startHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                               <option value="">Any Time</option>
                               {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              Time Window (End)
                            </label>
                            <select name="endHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                               <option value="">Any Time</option>
                               {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                            </select>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                         <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                           Lifespan
                         </label>
                         <select name="lifespan" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                            <option value="forever">Forever</option>
                            <option value="1_month">1 Month</option>
                            <option value="3_months">3 Months</option>
                            <option value="12_months">12 Months</option>
                         </select>
                       </div>
                    </>
                 )}

                 {ruleType === "SPECIAL" && (
                    <>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              Start Date
                            </label>
                            <input name="validFrom" type="date" required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              End Date
                            </label>
                            <input name="validTo" type="date" required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold" />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              Time Window (Start)
                            </label>
                            <select name="startHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                               <option value="">Any Time</option>
                               {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                              Time Window (End)
                            </label>
                            <select name="endHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                               <option value="">Any Time</option>
                               {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                            </select>
                          </div>
                       </div>

                       <div className="pt-2">
                         <label className="flex items-center gap-3 cursor-pointer group">
                           <div className="relative">
                             <input type="checkbox" name="holidayOverride" className="peer sr-only" />
                             <div className="block h-6 w-10 rounded-full bg-brand-black/10 dark:bg-white/10 peer-checked:bg-emerald-500 transition-colors"></div>
                             <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold">Holiday Override</span>
                             <span className="text-[10px] opacity-50 uppercase tracking-widest">Keep active during Federal Holidays</span>
                           </div>
                         </label>
                       </div>
                    </>
                 )}

              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-6 bg-brand-blue text-brand-latte font-black rounded-2xl shadow-xl shadow-brand-blue/20 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "CREATING..." : "BUILD TEMPLATE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
