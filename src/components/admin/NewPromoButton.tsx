"use client";

import { useState, useMemo } from "react";
import { Plus, X, Tag, Calendar as CalendarIcon, MapPin, Building2 } from "lucide-react";
import { createPromoRule } from "@/app/admin/promo-actions";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay
} from "date-fns";

interface NewPromoButtonProps {
  studios: { id: string; name: string; locationId: string }[];
  locations: { id: string; name: string }[];
}

export default function NewPromoButton({ studios, locations }: NewPromoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ruleType, setRuleType] = useState<"RECURRING" | "SPECIAL">("RECURRING");
  
  // State for preview
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedStudios, setSelectedStudios] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [validFrom, setValidFrom] = useState<string>("");
  const [validTo, setValidTo] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("ruleType", ruleType);
    
    selectedStudios.forEach(id => formData.append("targetStudioIds", id));
    if (selectedLocation) formData.append("targetLocationId", selectedLocation);
    
    try {
      const result = await createPromoRule(formData);
      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert("Validation or network error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (val: number) => {
    if (selectedDays.includes(val)) setSelectedDays(selectedDays.filter(d => d !== val));
    else setSelectedDays([...selectedDays, val]);
  };

  const toggleStudio = (id: string) => {
    if (selectedStudios.includes(id)) setSelectedStudios(selectedStudios.filter(s => s !== id));
    else setSelectedStudios([...selectedStudios, id]);
  };

  const filteredStudios = useMemo(() => {
    if (!selectedLocation) return studios;
    return studios.filter(s => s.locationId === selectedLocation);
  }, [selectedLocation, studios]);

  // Calendar Preview Logic
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startingDayIndex = getDay(currentMonthStart);

  const isDayHighlighted = (day: Date) => {
    if (ruleType === "RECURRING") {
      return selectedDays.includes(getDay(day));
    } else {
      if (!validFrom || !validTo) return false;
      const start = startOfDay(parseISO(validFrom));
      const end = endOfDay(parseISO(validTo));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
      return isWithinInterval(day, { start, end });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand-blue hover:bg-brand-jasmine text-brand-latte font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-95 text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> New Price Template
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] w-full max-w-5xl rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">New Price Template</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* LEFT: FORM */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-black/5 dark:border-white/5">
                <form id="promo-form" onSubmit={handleSubmit} className="space-y-6 font-sans">
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Rule Name</label>
                       <input name="name" required placeholder="e.g. Wednesday Afternoon Slump" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Discount ($)</label>
                          <input name="adjustmentValue" type="number" step="any" required placeholder="e.g. 15" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold font-mono" />
                          <input type="hidden" name="adjustmentType" value="fixed_amount" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Rule Type</label>
                          <select value={ruleType} onChange={(e) => setRuleType(e.target.value as "RECURRING" | "SPECIAL")} className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                            <option value="RECURRING">Recurring (Default)</option>
                            <option value="SPECIAL">Special Event</option>
                          </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Targeting</h3>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Location</label>
                      <select value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setSelectedStudios([]); }} className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                        <option value="">All Locations</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Studios</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                        {filteredStudios.length === 0 ? (
                           <p className="text-xs opacity-50 italic p-2">No studios available.</p>
                        ) : filteredStudios.map(s => (
                           <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                             <input type="checkbox" checked={selectedStudios.includes(s.id)} onChange={() => toggleStudio(s.id)} className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue" />
                             <span className="text-sm font-semibold truncate">{s.name}</span>
                           </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                     <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Schedule</h3>
                     
                     {ruleType === "RECURRING" && (
                        <>
                           <div className="space-y-1.5">
                             <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Days of Week</label>
                             <div className="flex gap-1">
                               {[
                                 { label: "S", val: 0 }, { label: "M", val: 1 }, { label: "T", val: 2 }, 
                                 { label: "W", val: 3 }, { label: "T", val: 4 }, { label: "F", val: 5 }, { label: "S", val: 6 }
                               ].map((day, idx) => (
                                 <label key={`${day.val}-${idx}`} className="cursor-pointer group flex-1">
                                   <input type="checkbox" name="daysOfWeek" value={day.val} checked={selectedDays.includes(day.val)} onChange={() => toggleDay(day.val)} className="hidden peer" />
                                   <div className="py-2 text-center rounded-xl border border-black/10 dark:border-white/10 bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:border-brand-blue peer-checked:bg-brand-blue text-brand-black dark:text-brand-latte peer-checked:text-white transition-all shadow-sm">
                                     <div className="text-xs font-black uppercase">{day.label}</div>
                                   </div>
                                 </label>
                               ))}
                             </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Time Window (Start)</label>
                                <select name="startHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                                   <option value="">Any Time</option>
                                   {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Time Window (End)</label>
                                <select name="endHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                                   <option value="">Any Time</option>
                                   {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                                </select>
                              </div>
                           </div>
                        </>
                     )}

                     {ruleType === "SPECIAL" && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Start Date</label>
                                <input name="validFrom" type="date" required value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">End Date</label>
                                <input name="validTo" type="date" required value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold" />
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Time Window (Start)</label>
                                <select name="startHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                                   <option value="">Any Time</option>
                                   {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Time Window (End)</label>
                                <select name="endHour" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none">
                                   <option value="">Any Time</option>
                                   {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                                </select>
                              </div>
                           </div>
                        </>
                     )}
                  </div>
                </form>
              </div>
              
              {/* RIGHT: PREVIEW */}
              <div className="w-full md:w-80 bg-brand-black/5 dark:bg-brand-latte/5 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto border-l border-black/5 dark:border-white/5">
                <div>
                   <h3 className="font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-brand-blue" /> Impact Preview</h3>
                   <div className="bg-white dark:bg-[#111] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                     <div className="text-center font-bold mb-3">{format(currentMonthStart, "MMMM yyyy")}</div>
                     <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold opacity-50 mb-2">
                       {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                     </div>
                     <div className="grid grid-cols-7 gap-1">
                       {Array.from({ length: startingDayIndex }).map((_, i) => (
                         <div key={`empty-${i}`} className="p-1" />
                       ))}
                       {daysInMonth.map(day => {
                         const highlighted = isDayHighlighted(day);
                         return (
                           <div key={day.toISOString()} className={cn("p-1.5 text-center text-xs font-semibold rounded-lg transition-colors", highlighted ? "bg-brand-blue text-white shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5")}>
                             {format(day, "d")}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-[#111] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-3">
                   <h4 className="text-sm font-bold opacity-70">Target Scope</h4>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Location</div>
                     <div className="text-sm font-semibold">{selectedLocation ? locations.find(l => l.id === selectedLocation)?.name : "All Locations"}</div>
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Studios</div>
                     <div className="text-sm font-semibold">{selectedStudios.length > 0 ? `${selectedStudios.length} Selected` : "All Studios in Location"}</div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 dark:border-white/5 shrink-0 bg-white dark:bg-[#111]">
              <button
                type="submit"
                form="promo-form"
                disabled={isSubmitting}
                className={cn(Theme.classes.primaryButton, "w-full")}
              >
                {isSubmitting ? "CREATING..." : "BUILD TEMPLATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
