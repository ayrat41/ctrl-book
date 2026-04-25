"use client";

import { useState } from "react";
import { Plus, X, MapPin } from "lucide-react";
import { createLocation } from "@/app/admin/locations/actions";
import { cn } from "@/lib/utils";

export default function NewLocationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "operations">("identity");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createLocation(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      setIsOpen(false);
      setActiveTab("identity");
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-brand-blue text-brand-latte font-bold rounded-xl shadow-xl shadow-brand-blue/20 active:scale-95 transition-all text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> New Location
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-xl rounded-[3rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center text-neutral-900 dark:text-brand-latte">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight">New Location</h2>
                   <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Physical Address Registry</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 opacity-20 hover:opacity-100" />
              </button>
            </div>

            <div className="flex px-10 pt-6 gap-8 border-b border-black/5 dark:border-white/5">
              <button 
                onClick={() => setActiveTab("identity")}
                className={cn(
                  "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                  activeTab === "identity" ? "text-brand-blue" : "opacity-30 hover:opacity-100"
                )}
              >
                1. Identity
                {activeTab === "identity" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab("operations")}
                className={cn(
                  "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                  activeTab === "operations" ? "text-brand-blue" : "opacity-30 hover:opacity-100"
                )}
              >
                2. Operations
                {activeTab === "operations" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 text-neutral-900 dark:text-brand-latte overflow-y-auto max-h-[60vh] hide-scrollbar">
               <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-300", activeTab !== "identity" && "hidden")}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Location Name</label>
                      <input name="name" required={activeTab === "identity"} placeholder="e.g. Downtown Hub" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Timezone</label>
                      <select name="timezone" required={activeTab === "identity"} className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold appearance-none">
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Street Address</label>
                      <input name="streetLine1" required={activeTab === "identity"} placeholder="123 Main St" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">City</label>
                        <input name="city" required={activeTab === "identity"} placeholder="New York" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">State</label>
                        <input name="state" required={activeTab === "identity"} placeholder="NY" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">ZIP Code</label>
                        <input name="zipCode" required={activeTab === "identity"} placeholder="10001" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Country</label>
                        <input name="country" required={activeTab === "identity"} defaultValue="US" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm" />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setActiveTab("operations")}
                    className="w-full py-4 mt-4 bg-brand-black/5 dark:bg-white/5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
                  >
                    Next: Configure Operations
                  </button>
               </div>

               <div className={cn("space-y-6 animate-in fade-in slide-in-from-left-4 duration-300", activeTab !== "operations" && "hidden")}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 text-brand-blue">Default Base Price ($)</label>
                      <input name="basePrice" type="number" step="0.01" defaultValue={100} required={activeTab === "operations"} className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1 text-red-500">Min Price Floor ($)</label>
                      <input name="minPriceFloor" type="number" step="0.01" defaultValue={0} required={activeTab === "operations"} className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Operating Days</label>
                      <div className="flex gap-1.5 h-12">
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
                            <input type="checkbox" name="availableDays" value={day.val} defaultChecked={day.val >= 1 && day.val <= 5} className="sr-only peer" />
                            <div className="w-full h-full flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-[10px] font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
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
                            <input type="checkbox" name="availableHours" value={hour} defaultChecked className="sr-only peer" />
                            <div className="w-full py-2 flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-[10px] font-bold border border-transparent peer-checked:border-brand-blue shadow-sm">
                              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 mt-6 bg-brand-blue text-brand-latte font-black rounded-[1.5rem] shadow-2xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-widest"
                  >
                    {isSubmitting ? "SYNCING..." : "Register Location"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("identity")}
                    className="w-full text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                  >
                    Back to Identity
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
