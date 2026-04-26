"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Tag,
  Calendar as CalendarIcon,
  Edit2,
  Clock,
} from "lucide-react";
import { createPromoRule, updatePromoRule } from "@/app/admin/promo-actions";
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
  endOfDay,
} from "date-fns";

const SLOT_TIMES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

interface PromoRuleModalProps {
  mode: "CREATE" | "EDIT";
  initialData?: any;
}

export default function PromoRuleModal({
  mode,
  initialData,
}: PromoRuleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ruleType, setRuleType] = useState<"RECURRING" | "SPECIAL">(
    initialData?.ruleType || "RECURRING",
  );

  // State for preview & form
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialData?.daysOfWeek || [],
  );
  const [selectedHours, setSelectedHours] = useState<number[]>(
    initialData?.specificHours || [],
  );
  const [validFrom, setValidFrom] = useState<string>(
    initialData?.validFrom ? format(new Date(initialData.validFrom), "yyyy-MM-dd") : "",
  );
  const [validTo, setValidTo] = useState<string>(
    initialData?.validTo ? format(new Date(initialData.validTo), "yyyy-MM-dd") : "",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("ruleType", ruleType);
    
    // Append hours
    selectedHours.forEach(h => formData.append("specificHours", h.toString()));

    try {
      const result =
        mode === "CREATE"
          ? await createPromoRule(formData)
          : await updatePromoRule(initialData.id, formData);

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
    if (selectedDays.includes(val))
      setSelectedDays(selectedDays.filter((d) => d !== val));
    else setSelectedDays([...selectedDays, val]);
  };

  const toggleHour = (val: number) => {
    if (selectedHours.includes(val))
      setSelectedHours(selectedHours.filter((h) => h !== val));
    else setSelectedHours([...selectedHours, val]);
  };

  // Calendar Preview Logic
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({
    start: currentMonthStart,
    end: currentMonthEnd,
  });
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
      {mode === "CREATE" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-brand-blue hover:bg-brand-jasmine text-brand-latte rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-95 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Price Template
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-brand-blue"
          title="Edit Template"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] w-full max-w-5xl rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-xl ">{mode === "CREATE" ? "New" : "Edit"} Price Template</h2>
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
                <form
                  id="promo-form"
                  onSubmit={handleSubmit}
                  className="space-y-6 font-sans"
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                        Rule Name
                      </label>
                      <input
                        name="name"
                        required
                        defaultValue={initialData?.name}
                        placeholder="e.g. Wednesday Afternoon Slump"
                        className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                          Discount ($)
                        </label>
                        <input
                          name="adjustmentValue"
                          type="number"
                          step="any"
                          required
                          defaultValue={Math.abs(initialData?.adjustmentValue || 0)}
                          placeholder="e.g. 15"
                          className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold font-mono"
                        />
                        <input
                          type="hidden"
                          name="adjustmentType"
                          value="fixed_amount"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                          Rule Type
                        </label>
                        <select
                          value={ruleType}
                          onChange={(e) =>
                            setRuleType(
                              e.target.value as "RECURRING" | "SPECIAL",
                            )
                          }
                          className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none"
                        >
                          <option value="RECURRING">Recurring (Default)</option>
                          <option value="SPECIAL">Special Event</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Active Time Slots
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {SLOT_TIMES.map((h) => {
                        const isSelected = selectedHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => toggleHour(h)}
                            className={cn(
                              "py-3 rounded-xl border text-[10px] font-bold transition-all shadow-sm",
                              isSelected
                                ? "bg-brand-blue text-white border-brand-blue shadow-lg"
                                : "bg-brand-black/5 dark:bg-brand-latte/5 border-transparent text-brand-black/60 hover:bg-brand-black/10"
                            )}
                          >
                            {h > 12 ? `${h - 12}PM` : `${h}AM`}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedHours(selectedHours.length === SLOT_TIMES.length ? [] : [...SLOT_TIMES])}
                        className="py-3 rounded-xl border border-dashed border-black/10 dark:border-white/10 text-[10px] font-bold hover:bg-black/5 transition-all opacity-60"
                      >
                        {selectedHours.length === SLOT_TIMES.length ? "CLEAR" : "ALL DAY"}
                      </button>
                    </div>
                    <p className="text-[10px] opacity-40 italic">
                      {selectedHours.length > 0 
                        ? `${selectedHours.length} slots selected. The discount will only apply during these hours.`
                        : "No specific slots selected. Discount will apply to all available hours by default."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Schedule
                    </h3>

                    {ruleType === "RECURRING" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                            Days of Week
                          </label>
                          <div className="flex gap-1">
                            {[
                              { label: "S", val: 0 },
                              { label: "M", val: 1 },
                              { label: "T", val: 2 },
                              { label: "W", val: 3 },
                              { label: "T", val: 4 },
                              { label: "F", val: 5 },
                              { label: "S", val: 6 },
                            ].map((day, idx) => (
                              <label
                                key={`${day.val}-${idx}`}
                                className="cursor-pointer group flex-1"
                              >
                                <input
                                  type="checkbox"
                                  name="daysOfWeek"
                                  value={day.val}
                                  checked={selectedDays.includes(day.val)}
                                  onChange={() => toggleDay(day.val)}
                                  className="hidden peer"
                                />
                                <div className="py-2 text-center rounded-xl border border-black/10 dark:border-white/10 bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:border-brand-blue peer-checked:bg-brand-blue text-brand-black dark:text-brand-latte peer-checked:text-white transition-all shadow-sm">
                                  <div className="text-xs uppercase">
                                    {day.label}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {ruleType === "SPECIAL" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                              Start Date
                            </label>
                            <input
                              name="validFrom"
                              type="date"
                              required
                              value={validFrom}
                              onChange={(e) => setValidFrom(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest opacity-40 ml-1">
                              End Date
                            </label>
                            <input
                              name="validTo"
                              type="date"
                              required
                              value={validTo}
                              onChange={(e) => setValidTo(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
                            />
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
                  <h3 className="mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-blue" /> Impact
                    Preview
                  </h3>
                  <div className="bg-white dark:bg-[#111] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                    <div className="text-center mb-3 text-sm">
                      {format(currentMonthStart, "MMMM yyyy")}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] opacity-50 mb-2">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startingDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-1" />
                      ))}
                      {daysInMonth.map((day) => {
                        const highlighted = isDayHighlighted(day);
                        return (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "p-1.5 text-center text-[10px] font-semibold rounded-lg transition-colors",
                              highlighted
                                ? "bg-brand-blue text-white shadow-sm"
                                : "hover:bg-black/5 dark:hover:bg-white/5",
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-3">
                  <h4 className="text-sm opacity-70">Target Scope</h4>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest opacity-50">
                      Scope
                    </div>
                    <div className="text-sm font-semibold">
                      Global Protocol
                    </div>
                  </div>
                  <p className="text-[10px] opacity-40 leading-relaxed font-medium">
                    This template applies automatically to all locations and studios unless overridden by a date-specific block.
                  </p>
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
                {isSubmitting ? "PROCESSING..." : mode === "CREATE" ? "BUILD TEMPLATE" : "UPDATE TEMPLATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
