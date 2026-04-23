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
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
import { updateSlotSettings, clearModeOverride } from "@/app/admin/actions";
import {
  assignPromoRule,
  deletePromoRule,
  createScopedPromoRule,
} from "@/app/admin/promo-actions";
import type { Location, Studio } from "@prisma/client";

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

  const SLOT_TIMES =
    Object.keys(pricingMap).length > 0
      ? Object.keys(pricingMap)
          .map(Number)
          .sort((a, b) => a - b)
      : [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const [abstractTemplates, setAbstractTemplates] = useState<any[]>([]);
  const [assignedRules, setAssignedRules] = useState<any[]>([]);
  const [activeAddons, setActiveAddons] = useState<any[]>([]);
  const [actionPending, setActionPending] = useState<boolean>(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [editingSlots, setEditingSlots] = useState<any[] | null>(null);
  const [selectedRuleHours, setSelectedRuleHours] = useState<number[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isWholeDay, setIsWholeDay] = useState(false);
  const [selectedBackdrops, setSelectedBackdrops] = useState<string[]>([]);
  const [configMode, setConfigMode] = useState<"STANDARD" | "SPECIAL">(
    "STANDARD",
  );

  // Initial Data Fetch
  useEffect(() => {
    fetch("/api/v1/locations")
      .then((res) => res.json())
      .then((locs) => {
        if (Array.isArray(locs)) {
          setLocations(locs);
          if (locs.length > 0) setSelectedLocation(locs[0].id);
        } else {
          console.error("Locations API did not return an array:", locs);
          setLocations([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching locations:", err);
        setLocations([]);
      });

    // Fetch all studios to use as "Styles"
    fetch("/api/v1/studios")
      .then((r) => r.json())
      .then((s) => {
        if (Array.isArray(s)) {
          setStyles(s);
        } else {
          console.error("Studios API did not return an array:", s);
          setStyles([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching styles:", err);
        setStyles([]);
      });
  }, []);

  // Fetch Location Context
  useEffect(() => {
    if (selectedLocation) {
      fetch(`/api/v1/locations/${selectedLocation}/studios`)
        .then((r) => r.json())
        .then((s) => {
          if (Array.isArray(s)) {
            setStudios(s);
          } else {
            console.error("Location studios API did not return an array:", s);
            setStudios([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching location studios:", err);
          setStudios([]);
        });
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
          if (data && typeof data === "object") {
            setOverrides(data.overrides || []);
            setPricingMap(data.pricingMap || {});
            setAbstractTemplates(data.abstractTemplates || []);
            setAssignedRules(data.assignedRules || []);
          } else {
            setOverrides([]);
            setPricingMap({});
            setAbstractTemplates([]);
            setAssignedRules([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching overrides:", err);
          setOverrides([]);
          setPricingMap({});
          setAbstractTemplates([]);
          setAssignedRules([]);
        });

      // Fetch active addons for this date
      fetch(`/api/v1/addons?date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => setActiveAddons(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [selectedLocation, selectedDate]);

  const handleAssignTemplate = async (templateId: string) => {
    if (!templateId || !selectedLocation) return;
    setActionPending(true);
    await assignPromoRule(templateId, selectedLocation, selectedRoot);
    // Refetch
    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setOverrides(data.overrides || []);
        setPricingMap(data.pricingMap || {});
        setAbstractTemplates(data.abstractTemplates || []);
        setAssignedRules(data.assignedRules || []);
        setActionPending(false);
      });
  };

  const handleUnassignTemplate = async (ruleId: string) => {
    setActionPending(true);
    await deletePromoRule(ruleId);
    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setOverrides(data.overrides || []);
        setPricingMap(data.pricingMap || {});
        setAbstractTemplates(data.abstractTemplates || []);
        setAssignedRules(data.assignedRules || []);
        setActionPending(false);
      });
  };

  const handleCreateScopedPromo = async (formData: FormData) => {
    if (!selectedLocation) return;
    setActionPending(true);

    // If the user selected specific backdrops, create a rule for each.
    // Otherwise, use the selectedRoot (the row they clicked).
    const targets =
      selectedBackdrops.length > 0 ? selectedBackdrops : [selectedRoot!];

    await createScopedPromoRule(formData, selectedLocation, targets);

    setEditingSlots(null);
    setSelectedBackdrops([]); // Reset selection

    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setOverrides(data.overrides || []);
        setPricingMap(data.pricingMap || {});
        setAssignedRules(data.assignedRules || []);
        setActionPending(false);
      });
  };

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

    const activeHours = isWholeDay ? SLOT_TIMES : selectedRuleHours;
    const activeSlotsBase = activeHours
      .map((h) => getSlotData(h))
      .filter(Boolean) as any[];

    // We need to apply this to ALL selected backdrops (rooms)
    const results: any[] = [];

    for (const type of selectedBackdrops) {
      const s = styles.find((st) => st.type === type);
      const activeStudioId = s?.id || null;
      const activeType = type;

      // Map Backdrop Type to physical Room ID
      // ROOM_A is usually White, ROOM_B is usually Black/Special
      // We try to find the actual roomId from the studio registry first
      const studioInLocation = studios.find((st) => st.type === type);
      const targetRoomId =
        studioInLocation?.roomId || (type === "White" ? "ROOM_A" : "ROOM_B");

      for (const slot of activeSlotsBase) {
        const res = await updateSlotSettings({
          roomId: targetRoomId,
          locationId: selectedLocation,
          startTime: slot.start,
          endTime: slot.end,
          isActive,
          activeStudioId,
          activeType,
          discount,
        });
        results.push(res);
      }
    }

    if (results.every((r) => r.success)) {
      setEditingSlots(null);
      setSelectedSlots([]);
      setSelectedBackdrops([]);
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

  const handleClearOverrides = async () => {
    if (!selectedLocation || !editingSlots?.length) return;

    setActionPending(true);
    const activeHours = isWholeDay ? SLOT_TIMES : selectedRuleHours;
    const activeSlotsBase = activeHours
      .map((h) => getSlotData(h))
      .filter(Boolean) as any[];

    const results: any[] = [];

    for (const type of selectedBackdrops) {
      const studioInLocation = studios.find((st) => st.type === type);
      const targetRoomId =
        studioInLocation?.roomId || (type === "White" ? "ROOM_A" : "ROOM_B");

      for (const slot of activeSlotsBase) {
        const res = await clearModeOverride(targetRoomId, slot.start, slot.end);
        results.push(res);
      }
    }

    if (results.every((r) => r.success)) {
      setEditingSlots(null);
      setSelectedSlots([]);
      setSelectedBackdrops([]);
      // Re-fetch
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      fetch(`/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}`)
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setPricingMap(data.pricingMap || {});
          setActionPending(false);
        });
    } else {
      alert("Failed to clear overrides");
      setActionPending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Context Bar */}
      <div className="glass p-8 rounded-[2.5rem] relative z-40">
        <div className="flex items-end gap-6 w-full">
          {/* Physical Location */}
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Physical Location
            </label>
            <select
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-[52px] px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-bold text-sm min-w-[200px]"
            >
              <option value="" disabled>
                Select Location
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Select (Root) */}
          <div className="flex flex-col gap-2 shrink-0">
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
                      ? "bg-white/80 dark:bg-[#111] shadow-lg text-brand-blue"
                      : "opacity-40 hover:opacity-100",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Active Rules Today */}
          <div className="flex flex-col gap-2 shrink-0 relative group">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Active Rules Today
            </label>
            <div className="flex h-[52px] items-center px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent hover:border-brand-blue/30 cursor-pointer transition-all group-hover:bg-brand-blue/5">
              <div className="flex items-center gap-3">
                <div className="flex h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-brand-blue">
                  {
                    assignedRules.filter((r) => {
                      const slotDay = getDay(selectedDate!);
                      const isDayMatch =
                        r.daysOfWeek.length === 0 ||
                        r.daysOfWeek.includes(slotDay);
                      const isStudioMatch =
                        r.targetStudioIds.length === 0 ||
                        r.targetStudioIds.includes(
                          studios.find((s) => s.type === selectedRoot)?.id || "",
                        );
                      const isValid =
                        (!r.validFrom ||
                          new Date(r.validFrom) <= selectedDate!) &&
                        (!r.validTo || new Date(r.validTo) >= selectedDate!);
                      return isDayMatch && isStudioMatch && isValid;
                    }).length
                  }{" "}
                  Rules Active
                </span>
              </div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white dark:bg-[#111] rounded-[2rem] shadow-2xl border border-black/5 dark:border-white/10 p-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 ml-1">
                  Today's Logic Stack
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {assignedRules.filter((r) => {
                    const slotDay = getDay(selectedDate!);
                    const isDayMatch =
                      r.daysOfWeek.length === 0 ||
                      r.daysOfWeek.includes(slotDay);
                    const isStudioMatch =
                      r.targetStudioIds.length === 0 ||
                      r.targetStudioIds.includes(
                        studios.find((s) => s.type === selectedRoot)?.id || "",
                      );
                    const isValid =
                      (!r.validFrom ||
                        new Date(r.validFrom) <= selectedDate!) &&
                      (!r.validTo || new Date(r.validTo) >= selectedDate!);
                    return isDayMatch && isStudioMatch && isValid;
                  }).length > 0 ? (
                    assignedRules
                      .filter((r) => {
                        const slotDay = getDay(selectedDate!);
                        const isDayMatch =
                          r.daysOfWeek.length === 0 ||
                          r.daysOfWeek.includes(slotDay);
                        const isStudioMatch =
                          r.targetStudioIds.length === 0 ||
                          r.targetStudioIds.includes(
                            studios.find((s) => s.type === selectedRoot)?.id ||
                              "",
                          );
                        const isValid =
                          (!r.validFrom ||
                            new Date(r.validFrom) <= selectedDate!) &&
                          (!r.validTo || new Date(r.validTo) >= selectedDate!);
                        return isDayMatch && isStudioMatch && isValid;
                      })
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex justify-between items-start gap-4 p-3 rounded-xl hover:bg-brand-blue/5 transition-colors border border-transparent hover:border-brand-blue/10"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold leading-tight">
                              {r.name}
                            </span>
                            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                              {r.ruleType} •{" "}
                              {r.startHour
                                ? `${r.startHour}:00-${r.endHour}:00`
                                : "Whole Day"}
                            </span>
                          </div>
                          <div className="shrink-0 px-2 py-1 rounded-lg bg-brand-blue/10 text-brand-blue/80ß text-[10px] font-black">
                            {r.adjustmentValue}%
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-20">
                        No Active Rules Today
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Add-ons Today */}
          <div className="flex flex-col gap-2 shrink-0 relative group">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Active Add-ons Today
            </label>
            <div className="flex h-[52px] items-center px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent hover:border-brand-jasmine/30 cursor-pointer transition-all group-hover:bg-brand-jasmine/5">
              <div className="flex items-center gap-3">
                <div className="flex h-2 w-2 rounded-full bg-brand-blue/80 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-brand-blue/80 dark:text-brand-jasmine">
                  {activeAddons.length} Extras Active
                </span>
              </div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white dark:bg-[#111] rounded-[2rem] shadow-2xl border border-black/5 dark:border-white/10 p-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 ml-1">
                  Live Upsell Catalog
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {activeAddons.length > 0 ? (
                    activeAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex justify-between items-center p-3 rounded-xl hover:bg-brand-jasmine/5 transition-colors border border-transparent hover:border-brand-jasmine/10"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight">
                            {addon.name}
                          </span>
                          <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                            {addon.validFrom || addon.validTo ? (
                              <span className="text-brand-jasmine/80">
                                {addon.validFrom
                                  ? new Date(
                                      addon.validFrom,
                                    ).toLocaleDateString()
                                  : "..."}{" "}
                                -{" "}
                                {addon.validTo
                                  ? new Date(addon.validTo).toLocaleDateString()
                                  : "..."}
                              </span>
                            ) : (
                              "Global Upsell"
                            )}
                          </span>
                        </div>
                        <div className="shrink-0 px-2 py-1 rounded-lg bg-brand-jasmine/10 text-brand-jasmine text-[10px] font-black">
                          +${addon.price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-20">
                        No Extras Active Today
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-stretch">
        {/* Left: Calendar Picker */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM do")
                  : "Select a date"}
              </h2>
            </div>
          </div>
          <div className="glass-card p-8 rounded-[2.5rem] flex-1 mt-6">
            <div className="flex justify-between items-center mb-8 bg-white/80 dark:bg-brand-latte/5 p-2 rounded-2xl">
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

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-4 px-2">
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
                      "h-12 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center relative ",
                      isPast
                        ? "opacity-10 cursor-not-allowed "
                        : "hover:scale-110 active:scale-95 bg-white/80 dark:bg-brand-latte/5",
                      isSelected
                        ? "bg-brand-blue/80 text-brand-latte shadow-xl shadow-brand-blue/30"
                        : "bg-white/90 dark:bg-brand-latte/[0.02] hover:bg-brand-black/5 dark:hover:bg-white/10",
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
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                {selectedRoot} Studio Slots
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-3 gap-3 mt-6">
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
                    "glass-card hover:border-brand-blue/30 hover:shadow-lg",
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
                  <div className="mt-1 flex flex-col items-center justify-center leading-none">
                    {data.hierarchy?.finalPrice !== undefined && (
                      <div className="text-xs font-black text-brand-blue/80 dark:text-brand-jasmine">
                        ${data.hierarchy.finalPrice || data.hierarchy.basePrice}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5 justify-center">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-sm flex-shrink-0",
                          isActive
                            ? "bg-emerald-500 shadow-emerald-500/50"
                            : "bg-red-500 shadow-red-500/50",
                        )}
                      />
                      {isActive &&
                        (hasOverrideStyle ||
                          discount > 0 ||
                          data.hierarchy?.ruleApplied) && (
                          <span className="text-[8px] font-bold uppercase truncate opacity-70 leading-none">
                            {[
                              (() => {
                                if (!hasOverrideStyle) return null;
                                const s = styles.find(
                                  (s) => s.id === data.override?.activeStudioId,
                                );
                                if (s?.type === selectedRoot) return null;
                                return s?.name || "Custom";
                              })(),
                              discount > 0 ? `-${discount}%` : null,
                              data.hierarchy?.ruleApplied &&
                              data.hierarchy.ruleApplied.adjustmentType ===
                                "percentage" &&
                              data.hierarchy.ruleApplied.adjustmentValue !== 0
                                ? `${data.hierarchy.ruleApplied.adjustmentValue}%`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={selectedSlots.length === 0}
              onClick={() => {
                if (selectedSlots.length > 0) {
                  setEditingSlots(selectedSlots);
                  setSelectedRuleHours(selectedSlots.map((s) => s.hour));
                  setIsWholeDay(false);
                  setIsRecurring(false);

                  // Initialize backdrops: if single slot has override with different type, include it
                  if (
                    selectedSlots.length === 1 &&
                    selectedSlots[0].override?.activeType
                  ) {
                    setSelectedBackdrops([
                      selectedSlots[0].override.activeType,
                    ]);
                  } else {
                    setSelectedBackdrops([selectedRoot]);
                  }
                }
              }}
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
      </div>

      {/* Editing Modal */}
      {editingSlots &&
        (() => {
          const singleSlotOverride =
            editingSlots.length === 1 ? editingSlots[0].override : null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="glass w-full max-w-lg rounded-[3.5rem] overflow-hidden">
                <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.75rem] bg-brand-blue/10 text-brand-blue/80 flex items-center justify-center">
                      <SlidersHorizontal className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">
                        {configMode === "RECURRING"
                          ? "Configure Recurring"
                          : configMode === "SPECIAL"
                            ? "Configure Special"
                            : editingSlots.length > 1
                              ? `Configure ${editingSlots.length} Slots`
                              : "Configure Slot"}
                      </h2>
                      {/* Active Rules Info */}
                      {editingSlots.length === 1 && (
                        <div className="mt-4 p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue/80 opacity-60">
                              Applied Logic
                            </span>
                            <div className="px-2 py-0.5 rounded-full bg-brand-blue text-white text-[9px] font-black uppercase">
                              {
                                assignedRules.filter((r) => {
                                  const slotHour = editingSlots[0].hour;
                                  const slotDay = getDay(selectedDate!);
                                  const isTimeMatch =
                                    (!r.startHour && !r.endHour) ||
                                    (slotHour >= r.startHour &&
                                      slotHour < r.endHour);
                                  const isDayMatch =
                                    r.daysOfWeek.length === 0 ||
                                    r.daysOfWeek.includes(slotDay);
                                  const isStudioMatch =
                                    r.targetStudioIds.length === 0 ||
                                    r.targetStudioIds.includes(
                                      studios.find(
                                        (s) => s.type === selectedRoot,
                                      )?.id || "",
                                    );
                                  return (
                                    isTimeMatch && isDayMatch && isStudioMatch
                                  );
                                }).length
                              }{" "}
                              Rules
                            </div>
                          </div>

                          <div className="space-y-2">
                            {assignedRules.filter((r) => {
                              const slotHour = editingSlots[0].hour;
                              const slotDay = getDay(selectedDate!);
                              const isTimeMatch =
                                (!r.startHour && !r.endHour) ||
                                (slotHour >= r.startHour &&
                                  slotHour < r.endHour);
                              const isDayMatch =
                                r.daysOfWeek.length === 0 ||
                                r.daysOfWeek.includes(slotDay);
                              const isStudioMatch =
                                r.targetStudioIds.length === 0 ||
                                r.targetStudioIds.includes(
                                  studios.find((s) => s.type === selectedRoot)
                                    ?.id || "",
                                );
                              return isTimeMatch && isDayMatch && isStudioMatch;
                            }).length > 0 ? (
                              assignedRules
                                .filter((r) => {
                                  const slotHour = editingSlots[0].hour;
                                  const slotDay = getDay(selectedDate!);
                                  const isTimeMatch =
                                    (!r.startHour && !r.endHour) ||
                                    (slotHour >= r.startHour &&
                                      slotHour < r.endHour);
                                  const isDayMatch =
                                    r.daysOfWeek.length === 0 ||
                                    r.daysOfWeek.includes(slotDay);
                                  const isStudioMatch =
                                    r.targetStudioIds.length === 0 ||
                                    r.targetStudioIds.includes(
                                      studios.find(
                                        (s) => s.type === selectedRoot,
                                      )?.id || "",
                                    );
                                  return (
                                    isTimeMatch && isDayMatch && isStudioMatch
                                  );
                                })
                                .map((r) => (
                                  <div
                                    key={r.id}
                                    className="flex justify-between items-center py-1 border-b border-brand-blue/5 last:border-none"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold">
                                        {r.name}
                                      </span>
                                      <span className="text-[9px] opacity-40 uppercase font-black">
                                        {r.ruleType}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-black text-brand-blue">
                                      {r.adjustmentValue}%
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="text-xs font-bold opacity-30 italic">
                                No rules active (Base Price Only)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {configMode === "ONE_DAY" && (
                        <p className="text-xs font-bold opacity-30 uppercase tracking-widest">
                          {editingSlots.length > 1
                            ? `${editingSlots.length} slots selected • ${selectedRoot}`
                            : `${format(editingSlots[0].start, "hh:mm aa")} • ${selectedRoot}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSlots(null)}
                    className="p-4 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-all"
                  >
                    <X className="w-6 h-6 opacity-20 hover:opacity-100" />
                  </button>
                </div>

                <div className="px-10 pt-6 pb-2">
                  <div className="flex bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl p-1.5 h-12">
                    {["STANDARD", "SPECIAL"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setConfigMode(m as any)}
                        className={cn(
                          "flex-1 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                          configMode === m
                            ? "bg-white dark:bg-[#111] text-brand-blue/80 shadow-md"
                            : "opacity-50 hover:opacity-100",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {configMode === "STANDARD" && (
                  <form
                    action={
                      isRecurring ? handleCreateScopedPromo : saveSlotOverride
                    }
                    className="p-10 pt-4 space-y-6"
                  >
                    {isRecurring && (
                      <>
                        <input
                          type="hidden"
                          name="ruleType"
                          value="RECURRING"
                        />
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                            Template Name
                          </label>
                          <input
                            name="name"
                            required
                            placeholder="e.g. Standard Recurring Rule"
                            className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 outline-none font-semibold"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2 mt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                          Selected Timeslots
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer mr-2">
                          <input
                            type="checkbox"
                            checked={isWholeDay}
                            onChange={(e) => setIsWholeDay(e.target.checked)}
                            className="peer rounded"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 peer-checked:opacity-100 peer-checked:text-brand-blue/80 transition-all">
                            Whole day
                          </span>
                        </label>
                      </div>
                      {!isWholeDay ? (
                        <div className="grid grid-cols-6 gap-2">
                          {SLOT_TIMES.map((hour) => {
                            const isSelected = selectedRuleHours.includes(hour);
                            return (
                              <button
                                key={hour}
                                type="button"
                                onClick={() => {
                                  setSelectedRuleHours((prev) => {
                                    if (prev.includes(hour))
                                      return prev.filter((h) => h !== hour);
                                    return [...prev, hour];
                                  });
                                }}
                                className={cn(
                                  "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-center",
                                  isSelected
                                    ? "bg-brand-blue border-brand-blue text-brand-latte shadow-md shadow-brand-blue/30 scale-105 z-10 relative"
                                    : "bg-brand-black/5 dark:bg-brand-latte/5 border-transparent opacity-50 hover:opacity-100",
                                )}
                              >
                                {hour > 12 ? hour - 12 : hour}
                                <span className="opacity-50 ml-0.5">
                                  {hour >= 12 ? "p" : "a"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full py-4 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-brand-blue/20 text-center text-brand-blue/80 text-xs font-black uppercase tracking-widest">
                          All 12 Timeslots Selected
                        </div>
                      )}
                      {isRecurring && (
                        <>
                          <input
                            type="hidden"
                            name="startHour"
                            value={
                              selectedRuleHours.length > 0 || isWholeDay
                                ? isWholeDay
                                  ? Math.min(...SLOT_TIMES)
                                  : Math.min(...selectedRuleHours)
                                : ""
                            }
                          />
                          <input
                            type="hidden"
                            name="endHour"
                            value={
                              selectedRuleHours.length > 0 || isWholeDay
                                ? isWholeDay
                                  ? Math.max(...SLOT_TIMES) + 1
                                  : Math.max(...selectedRuleHours) + 1
                                : ""
                            }
                          />
                        </>
                      )}
                    </div>

                    {/* Visibility and Discount */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                            Visibility
                          </label>
                          <p className="text-[10px] font-bold opacity-30 uppercase">
                            Hide slot
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-90 origin-right">
                          <input
                            type="checkbox"
                            name="isActive"
                            value="true"
                            defaultChecked={
                              singleSlotOverride
                                ? singleSlotOverride.isActive
                                : true
                            }
                            className="sr-only peer"
                          />
                          <div className="w-14 h-8 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                      </div>

                      <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          name={isRecurring ? "discountPercent" : "discount"}
                          placeholder="0"
                          min="0"
                          max="100"
                          defaultValue={
                            singleSlotOverride ? singleSlotOverride.discount : 0
                          }
                          required={isRecurring}
                          className="w-full bg-transparent outline-none font-mono font-bold text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                        Backdrop Overlay
                      </label>
                      <div className="flex gap-2">
                        {["White", "Black", "Special"].map((type) => {
                          const isSelected = selectedBackdrops.includes(type);
                          return (
                            <label key={type} className="cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBackdrops([
                                      ...selectedBackdrops,
                                      type,
                                    ]);
                                  } else {
                                    setSelectedBackdrops(
                                      selectedBackdrops.filter(
                                        (t) => t !== type,
                                      ),
                                    );
                                  }
                                }}
                                className="hidden peer"
                              />
                              <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                                {type}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {isRecurring && (
                        <input
                          type="hidden"
                          name="overrideIsActive"
                          value="true"
                        />
                      )}
                    </div>

                    <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="w-5 h-5 accent-brand-blue"
                        />
                        <span className="text-sm font-black uppercase tracking-widest opacity-80">
                          Make it recurring
                        </span>
                      </label>

                      {isRecurring && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5 flex flex-col justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                              Days of Week
                            </label>
                            <div className="flex gap-1 h-12">
                              {[
                                { label: "S", val: 0 },
                                { label: "M", val: 1 },
                                { label: "T", val: 2 },
                                { label: "W", val: 3 },
                                { label: "T", val: 4 },
                                { label: "F", val: 5 },
                                { label: "S", val: 6 },
                              ].map((day) => (
                                <label
                                  key={day.val}
                                  className="cursor-pointer flex-1 h-full"
                                >
                                  <input
                                    type="checkbox"
                                    name="daysOfWeek"
                                    value={day.val}
                                    className="hidden peer"
                                  />
                                  <div className="h-full flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-white transition-all text-xs font-black uppercase border border-transparent peer-checked:border-brand-blue">
                                    <span className="opacity-60 peer-checked:opacity-100 text-brand-black dark:text-brand-latte peer-checked:text-white">
                                      {day.label}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5 flex flex-col justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                              Lifespan
                            </label>
                            <select
                              name="lifespan"
                              className="w-full h-12 px-4 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 font-bold text-sm tracking-widest uppercase outline-none appearance-none border border-transparent focus:border-brand-blue/50"
                            >
                              <option value="forever">Forever</option>
                              <option value="1_month">1 Month</option>
                              <option value="3_months">3 Months</option>
                              <option value="12_months">12 Months</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Inspector Widget Context check could go here if needed... */}

                    <div className="pt-6 border-t border-black/5 dark:border-white/5 flex gap-4">
                      {!isRecurring && (
                        <button
                          type="button"
                          onClick={handleClearOverrides}
                          disabled={actionPending}
                          className="flex-1 py-6 bg-brand-black/5 dark:bg-brand-latte/5 text-black/40 dark:text-brand-latte/40 font-black rounded-[2rem] hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.2em]"
                        >
                          Reset to Default
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={actionPending}
                        className={cn(
                          "py-6 bg-brand-blue text-brand-latte font-black rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]",
                          isRecurring ? "w-full" : "flex-[2]",
                        )}
                      >
                        {actionPending
                          ? "Syncing..."
                          : isRecurring
                            ? "Create Template"
                            : "Apply to Calendar"}
                      </button>
                    </div>
                  </form>
                )}

                {configMode === "SPECIAL" && (
                  <form
                    action={handleCreateScopedPromo}
                    className="p-10 pt-4 space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase opacity-40 ml-1">
                          Rule Name
                        </label>
                        <input
                          name="name"
                          type="text"
                          placeholder="e.g. Holiday Special"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 outline-none font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase opacity-40 ml-1">
                            Start Date
                          </label>
                          <input
                            name="validFrom"
                            type="date"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 outline-none font-semibold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase opacity-40 ml-1">
                            End Date
                          </label>
                          <input
                            name="validTo"
                            type="date"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 outline-none font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                              Discount (%)
                            </label>
                            <input
                              name="discountPercent"
                              type="number"
                              placeholder="0"
                              defaultValue={0}
                              className="w-full bg-transparent border-none outline-none font-black text-xl text-brand-blue/80 dark:text-brand-jasmine"
                            />
                          </div>
                          <span className="text-2xl font-black opacity-20">
                            %
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
                          Backdrop Overlay
                        </label>
                        <div className="flex gap-2">
                          {["White", "Black", "Special"].map((type) => {
                            const isSelected = selectedBackdrops.includes(type);
                            return (
                              <label
                                key={type}
                                className="cursor-pointer flex-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBackdrops([
                                        ...selectedBackdrops,
                                        type,
                                      ]);
                                    } else {
                                      setSelectedBackdrops(
                                        selectedBackdrops.filter(
                                          (t) => t !== type,
                                        ),
                                      );
                                    }
                                  }}
                                  className="hidden peer"
                                />
                                <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs font-black uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                                  {type}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        <input type="hidden" name="ruleType" value="SPECIAL" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={actionPending}
                      className="w-full py-6 bg-brand-blue text-brand-latte font-black rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]"
                    >
                      {actionPending ? "Building Bounds..." : `Apply config`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
