"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  setHours,
  setMinutes,
} from "date-fns";
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  Settings2,
  SlidersHorizontal,
  Info,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
import { updateSlotSettings } from "@/app/admin/actions";
import type { Location, Studio } from "@prisma/client";

const SLOT_TIMES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function AdminCalendarFlow() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]); // Current Location's Studios
  const [styles, setStyles] = useState<Studio[]>([]); // All Styles from Registry
  const [selectedRoot, setSelectedRoot] = useState<"White" | "Black">("White");

  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const [overrides, setOverrides] = useState<any[]>([]); // StudioModeSchedule records
  const [pricingMap, setPricingMap] = useState<Record<string, any>>({});
  const [actionPending, setActionPending] = useState<boolean>(false);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [editingSlots, setEditingSlots] = useState<any[] | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetch("/api/v1/locations")
      .then((res) => res.json())
      .then((locs) => {
        setLocations(locs);
        if (locs.length > 0) setSelectedLocation(locs[0].id);
      });

    // Fetch all studios to use as "Styles"
    fetch("/api/v1/studios")
      .then((r) => r.json())
      .then((s) => setStyles(s));
  }, []);

  // Fetch Location Context
  useEffect(() => {
    if (selectedLocation) {
      fetch(`/api/v1/locations/${selectedLocation}/studios`)
        .then((r) => r.json())
        .then((s) => setStudios(s));
    }
  }, [selectedLocation]);

  // Fetch Date/Slot Context
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      // We'll use the existing availability endpoint but we need overrides primarily
      fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setPricingMap(data.pricingMap || {});
        })
        .catch(() => {
          setOverrides([]);
          setPricingMap({});
        });
    }
  }, [selectedLocation, selectedDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startingDayIndex = getDay(startOfMonth(currentMonth));

  const getSlotData = (hour: number) => {
    if (!selectedDate) return null;
    const start = setHours(setMinutes(startOfDay(selectedDate), 0), hour);
    const end = setHours(setMinutes(startOfDay(selectedDate), 45), hour); // 45 min session

    // Find if there's an override for this specific physical room root on this day/time
    // We assume ROOM_A = White Root, ROOM_B = Black Root for this example logic
    const targetRoomId = selectedRoot === "White" ? "ROOM_A" : "ROOM_B";
    const override = overrides.find(
      (o) =>
        isSameDay(new Date(o.startTime), start) &&
        new Date(o.startTime).getHours() === hour &&
        o.roomId === targetRoomId,
    );

    const hierarchy = pricingMap[hour.toString()] || null;

    return {
      hour,
      start,
      end,
      override,
      roomId: targetRoomId,
      hierarchy,
    };
  };

  const saveSlotOverride = async (formData: FormData) => {
    if (!selectedLocation || !editingSlots?.length) return;

    setActionPending(true);
    const isActive = formData.get("isActive") === "true";
    const activeStudioId = (formData.get("styleId") as string) || null;
    const activeType =
      styles.find((s) => s.id === activeStudioId)?.type || null;
    const discount = parseFloat(formData.get("discount") as string) || 0;
    const priceOverrideText = formData.get("priceOverride") as string;
    const priceOverride = priceOverrideText ? parseFloat(priceOverrideText) : undefined;

    // Safety Lock
    if (priceOverride !== undefined && editingSlots.length > 0 && editingSlots[0].hierarchy) {
      if (priceOverride < editingSlots[0].hierarchy.floor) {
        alert("SAFETY LOCK: Cannot set slot price below the minimal constraint ($" + editingSlots[0].hierarchy.floor + ").");
        setActionPending(false);
        return;
      }
    }

    const promises = editingSlots.map((slot) =>
      updateSlotSettings({
        roomId: slot.roomId,
        locationId: selectedLocation,
        startTime: slot.start,
        endTime: slot.end,
        isActive,
        activeStudioId,
        activeType,
        discount,
        priceOverride,
      }),
    );

    const results = await Promise.all(promises);

    if (results.every((r) => r.success)) {
      setEditingSlots(null);
      setSelectedSlots([]);
      // Re-fetch overrides
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setPricingMap(data.pricingMap || {});
          setActionPending(false);
        });
    } else {
      alert("Failed to save overrides");
      setActionPending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Context Bar */}
      <div className="bg-white dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex flex-wrap items-end gap-6">
          {/* Location Select */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Physical Location
            </label>
            <select
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-[52px] px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-bold text-sm min-w-[200px]"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Select (Root) */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Studio Selection
            </label>
            <div className="flex h-[52px] p-1.5 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl gap-1">
              {["White", "Black"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedRoot(type as any)}
                  className={cn(
                    "px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    selectedRoot === type
                      ? "bg-white dark:bg-[#111] shadow-lg text-brand-blue"
                      : "opacity-40 hover:opacity-100",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Extras
            </label>
            <div className="flex items-center h-[52px] px-6 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  {/* Hidden Native Checkbox */}
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    onChange={(e) => console.log("Add-ons Toggle Active")}
                  />

                  {/* Custom Outer Square */}
                  <div className="w-5 h-5 rounded border-2 border-black/10 dark:border-white/10 peer-checked:border-brand-blue transition-all duration-300 group-hover:border-brand-blue/40" />

                  {/* The "Green Glow" Inner Dot */}
                  <div className="absolute w-2.5 h-2.5 rounded-sm bg-brand-blue scale-0 peer-checked:scale-100 transition-transform duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                </div>

                <span className="text-xs font-black uppercase tracking-[0.1em] peer-checked:text-brand-blue transition-colors">
                  Add-ons
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8">
        {/* Left: Calendar Picker */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM do")
                  : "Select a date"}
              </h2>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-8 bg-brand-black/5 dark:bg-brand-latte/5 p-2 rounded-2xl">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-black uppercase tracking-widest text-sm">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 px-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {daysInMonth.map((day) => {
                const isPast = isBefore(day, startOfDay(new Date()));
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-12 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center relative",
                      isPast
                        ? "opacity-10 cursor-not-allowed"
                        : "hover:scale-110 active:scale-95",
                      isSelected
                        ? "bg-brand-blue text-brand-latte shadow-xl shadow-brand-blue/30"
                        : "bg-brand-black/[0.02] dark:bg-brand-latte/[0.02] hover:bg-brand-black/5 dark:hover:bg-white/10",
                      isToday && !isSelected && "border-2 border-brand-blue/20",
                    )}
                  >
                    {format(day, "d")}
                    {isToday && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: The Grid Overrides */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                {selectedRoot} Studio Slots
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-3 gap-3">
            {SLOT_TIMES.map((hour) => {
              const data = getSlotData(hour);
              if (!data) return null;
              const isActive = data.override ? data.override.isActive : true;
              const discount = data.override?.discount || 0;
              const hasOverrideStyle = !!data.override?.activeStudioId;
              const isSelected = selectedSlots.some((s) => s.hour === hour);

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSlots(
                        selectedSlots.filter((s) => s.hour !== hour),
                      );
                    } else {
                      setSelectedSlots([...selectedSlots, data]);
                    }
                  }}
                  className={cn(
                    "relative h-20 flex flex-col items-center justify-center rounded-2xl border transition-all group hover:scale-[1.05] active:scale-[0.95]",
                    "bg-white dark:bg-[#111] shadow-md hover:border-brand-blue/30 hover:shadow-lg border-black/5 dark:border-white/5",
                    isSelected &&
                      "border-solid border-brand-blue shadow-brand-blue/30 ring-2 ring-brand-blue",
                  )}
                >
                  <div className="font-black text-xl flex items-baseline gap-[1px] leading-none">
                    {hour > 12 ? hour - 12 : hour}
                    <span className="text-[10px] uppercase opacity-50 font-bold">
                      {hour >= 12 ? "pm" : "am"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 w-[85%] justify-center">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-sm flex-shrink-0",
                        isActive
                          ? "bg-emerald-500 shadow-emerald-500/50"
                          : "bg-red-500 shadow-red-500/50",
                      )}
                    />
                    {(hasOverrideStyle ||
                      discount > 0 ||
                      data.override?.priceOverride) && (
                      <span className="text-[8px] font-bold uppercase truncate opacity-70 leading-none">
                        {[
                          hasOverrideStyle
                            ? styles.find(
                                (s) => s.id === data.override?.activeStudioId,
                              )?.name || "Custom"
                            : null,
                          data.override?.priceOverride
                            ? `$${data.override.priceOverride}`
                            : null,
                          discount > 0 ? `-${discount}%` : null,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              if (selectedSlots.length > 0) {
                setEditingSlots(selectedSlots);
              }
            }}
            disabled={selectedSlots.length === 0}
            className={cn(
              "w-full py-4 font-black rounded-2xl transition-all uppercase tracking-widest text-sm",
              selectedSlots.length > 0
                ? "bg-brand-blue text-brand-latte shadow-xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98]"
                : "bg-brand-black/5 dark:bg-brand-latte/5 text-black/30 dark:text-brand-latte/30 cursor-not-allowed",
            )}
          >
            {selectedSlots.length > 0
              ? `Configure Selected (${selectedSlots.length})`
              : "Select timeslot to configure"}
          </button>
        </div>
      </div>

      {/* Editing Modal */}
      {editingSlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[3.5rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden">
            <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.75rem] bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {editingSlots.length > 1
                      ? `Configure ${editingSlots.length} Slots`
                      : "Configure Slot"}
                  </h2>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">
                    {editingSlots.length > 1
                      ? `${editingSlots.length} slots selected • ${selectedRoot}`
                      : `${format(editingSlots[0].start, "hh:mm aa")} • ${selectedRoot}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSlots(null)}
                className="p-4 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-6 h-6 opacity-20 hover:opacity-100" />
              </button>
            </div>

            <form key={editingSlots.map(s => s.hour).join(',')} action={saveSlotOverride} className="p-10 space-y-8">
              <div className="flex items-center justify-between p-6 bg-brand-black/5 dark:bg-brand-latte/5 rounded-[2rem]">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40">
                    Slot Visibility
                  </label>
                  <p className="text-[10px] font-bold opacity-20 uppercase">
                    Hide from client watch
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={
                      editingSlots.length === 1 && editingSlots[0].override
                        ? editingSlots[0].override.isActive
                        : true
                    }
                    value="true"
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue"></div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                  Active Room Style
                </label>
                <select
                  name="styleId"
                  defaultValue={
                    editingSlots.length === 1 &&
                    editingSlots[0].override?.activeStudioId
                      ? editingSlots[0].override.activeStudioId
                      : ""
                  }
                  className="w-full px-6 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-bold text-sm appearance-none"
                >
                  <option value="">Default ({selectedRoot})</option>
                  {styles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    defaultValue={
                      editingSlots.length === 1 && editingSlots[0].override?.discount != null
                        ? editingSlots[0].override.discount
                        : ""
                    }
                    placeholder="0"
                    className="w-full px-6 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                    Price Override ($)
                  </label>
                  <input
                    type="number"
                    name="priceOverride"
                    defaultValue={
                      editingSlots.length === 1 && editingSlots[0].override?.priceOverride != null
                        ? editingSlots[0].override.priceOverride
                        : ""
                    }
                    placeholder="Base"
                    className="w-full px-6 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Price Inspector Widget */}
              {editingSlots.length === 1 && editingSlots[0].hierarchy && (
                 <div className="bg-brand-black text-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                     <ShieldAlert className="w-24 h-24" />
                   </div>
                   <h4 className="font-bold mb-3 flex items-center text-sm uppercase tracking-widest text-brand-jasmine"><Info className="w-4 h-4 mr-2" /> Price Inspector</h4>
                   <div className="space-y-1 relative z-10">
                     <p className="text-sm font-medium flex justify-between">
                       <span className="opacity-60">Location Base Price:</span> 
                       <span>${editingSlots[0].hierarchy.basePrice}</span>
                     </p>
                     {editingSlots[0].hierarchy.ruleApplied ? (
                       <p className="text-sm font-medium flex justify-between items-center text-brand-jasmine">
                         <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {editingSlots[0].hierarchy.ruleApplied.name}:</span> 
                         <span>{editingSlots[0].hierarchy.ruleApplied.adjustmentType === 'percentage' ? '+' : ''}{editingSlots[0].hierarchy.ruleApplied.adjustmentValue}{editingSlots[0].hierarchy.ruleApplied.adjustmentType === 'percentage' ? '%' : ''}</span>
                       </p>
                     ) : (
                       <p className="text-sm font-medium flex justify-between items-center opacity-60">
                         <span>Active Template:</span> 
                         <span>None</span>
                       </p>
                     )}
                     <p className="text-sm font-black mt-2 pt-2 border-t border-white/20 flex justify-between">
                       <span>Final Calculated Cost:</span>
                       <span>${editingSlots[0].hierarchy.finalPrice}</span>
                     </p>
                   </div>
                   
                   {/* Collision warning system */}
                   {editingSlots[0].hierarchy.hasCollision && (
                     <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-xl flex items-start text-xs font-bold leading-tight relative z-10">
                       <ShieldAlert className="w-5 h-5 mr-3 shrink-0"/>
                       <span><span className="text-white block mb-1">COLLISION OVERRIDE:</span> A Recurring rule was suppressed by an active Special bounds override on this specific date.</span>
                     </div>
                   )}
                 </div>
              )}

              <button
                type="submit"
                disabled={actionPending}
                className="w-full py-6 bg-brand-blue text-brand-latte font-black rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]"
              >
                {actionPending ? "Syncing..." : "Apply Config"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
