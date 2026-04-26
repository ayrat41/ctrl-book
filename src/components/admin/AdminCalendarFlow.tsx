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
  Calendar,
  CalendarDays,
  Info,
  Tag,
  ChevronDown,
  Check,
  History,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
import {
  updateSlotSettings,
  clearModeOverride,
  blockSlot,
  unblockSlot,
  resetDailyOverrides,
} from "@/app/admin/actions";
import {
  assignPromoRule,
  deletePromoRule,
  createScopedPromoRule,
} from "@/app/admin/promo-actions";
import type { Location, Studio } from "@prisma/client";

export default function AdminCalendarFlow() {
  const formatRoom = (s: string) => {
    if (!s) return "";
    const clean = s.replace("ROOM_", "");
    return clean.charAt(0) + clean.slice(1).toLowerCase();
  };

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]); // Current Location's Studios
  const [styles, setStyles] = useState<Studio[]>([]); // All Styles from Registry
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>("");
  const [selectedStudioId, setSelectedStudioId] = useState<string>("");

  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const [operationalMode, setOperationalMode] = useState<
    "OVERRIDES" | "BLOCKING"
  >("OVERRIDES");
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

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
  const [configMode, setConfigMode] = useState<
    "STANDARD" | "SPECIAL" | "RECURRING" | "ONE_DAY"
  >("STANDARD");

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

    fetch("/api/v1/studios/types")
      .then((r) => r.json())
      .then((types) => {
        if (Array.isArray(types)) {
          setRoomTypes(types);
          if (types.length > 0) setSelectedRoot(types[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
      fetch(`/api/v1/locations/${selectedLocation}/studios?date=${dateStr}`)
        .then((r) => r.json())
        .then((s) => {
          if (Array.isArray(s)) {
            setStudios(s);
            // If the current selectedRoot or studioId is no longer valid, fallback
            const currentStillValid = s.find(
              (st) => st.id === selectedStudioId,
            );
            if (!currentStillValid && s.length > 0) {
              setSelectedStudioId(s[0].id);
              setSelectedRoot(s[0].roomId);
            }
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
  }, [selectedLocation, selectedDate]);

  // Fetch Date/Slot Context
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const studioParam = selectedStudioId
        ? `&studioId=${selectedStudioId}`
        : "";
      // We'll use the existing availability endpoint but we need overrides primarily
      fetch(
        `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}&roomId=${selectedRoot}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data === "object") {
            setOverrides(data.overrides || []);
            setBlockedSlots(data.blockedSlots || []);
            setPricingMap(data.pricingMap || {});
            setAbstractTemplates(data.abstractTemplates || []);
            setAssignedRules(data.assignedRules || []);
          } else {
            setOverrides([]);
            setBlockedSlots([]);
            setPricingMap({});
            setAbstractTemplates([]);
            setAssignedRules([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching overrides:", err);
          setOverrides([]);
          setBlockedSlots([]);
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
  }, [selectedLocation, selectedDate, selectedStudioId, selectedRoot]);

  const handleAssignTemplate = async (templateId: string) => {
    if (!templateId || !selectedLocation) return;
    setActionPending(true);
    await assignPromoRule(templateId, selectedLocation, selectedRoot);
    // Refetch
    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    const studioParam = selectedStudioId ? `&studioId=${selectedStudioId}` : "";
    fetch(
      `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}&roomId=${selectedRoot}`,
    )
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
    const studioParam = selectedStudioId ? `&studioId=${selectedStudioId}` : "";
    fetch(
      `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}&roomId=${selectedRoot}`,
    )
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

    const result = await createScopedPromoRule(
      formData,
      selectedLocation,
      targets,
    );

    if (!result.success) {
      alert(result.error);
      setActionPending(false);
      return;
    }

    setEditingSlots(null);
    setSelectedBackdrops([]); // Reset selection

    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    const studioParam = selectedStudioId ? `&studioId=${selectedStudioId}` : "";
    fetch(
      `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}`,
    )
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
    const studioInLocation = studios.find((s) => s.id === selectedStudioId);
    const targetRoomId = selectedRoot;
    const override = overrides.find(
      (o) =>
        isSameDay(new Date(o.startTime), start) &&
        new Date(o.startTime).getHours() === hour &&
        o.roomId === targetRoomId,
    );

    const blockedData = blockedSlots.find(
      (b) =>
        isSameDay(new Date(b.startTime), start) &&
        new Date(b.startTime).getHours() === hour &&
        (b.studioId === studioInLocation?.id || b.studioId === null),
    );

    const hierarchy = pricingMap[hour.toString()] || null;

    return {
      hour,
      start,
      end,
      override,
      roomId: targetRoomId,
      hierarchy,
      isBlocked: !!blockedData,
      blockedReason: blockedData?.reason || null,
    };
  };

  const saveSlotOverride = async (formData: FormData) => {
    if (!selectedLocation || !editingSlots?.length) return;

    setActionPending(true);
    const isActive = formData.get("isActive") === "true";
    const adjustmentType =
      (formData.get("adjustmentType") as string) || "fixed_amount";
    let adjustmentValue =
      parseFloat(formData.get("adjustmentValue") as string) || 0;

    // Convention: if 'Off (-$)' is selected and value is positive, make it negative
    if (adjustmentType === "fixed_amount" && adjustmentValue > 0) {
      adjustmentValue = -adjustmentValue;
    }

    const activeHours = isWholeDay ? SLOT_TIMES : selectedRuleHours;
    const activeSlotsBase = activeHours
      .map((h) => getSlotData(h))
      .filter(Boolean) as any[];

    // We need to apply this to ALL selected backdrops (rooms)
    const results: any[] = [];

    for (const roomId of selectedBackdrops) {
      let s;
      if (configMode === "SPECIAL") {
        // Find a special studio valid for the selected date
        s = styles.find(
          (st) =>
            st.roomId === roomId &&
            st.isSpecial &&
            (!st.validFrom ||
              startOfDay(new Date(st.validFrom)) <=
                startOfDay(selectedDate!)) &&
            (!st.validTo ||
              startOfDay(new Date(st.validTo)) >= startOfDay(selectedDate!)),
        );
        // Fallback to standard if no special found for this date
        if (!s) s = styles.find((st) => st.roomId === roomId && !st.isSpecial);
      } else {
        s = styles.find((st) => st.roomId === roomId && !st.isSpecial);
      }

      const activeStudioId = s?.id || null;

      // Map Backdrop Type to physical Room ID
      const targetRoomId = roomId;

      for (const slot of activeSlotsBase) {
        const res = await updateSlotSettings({
          roomId: targetRoomId as any,
          locationId: selectedLocation,
          startTime: slot.start,
          endTime: slot.end,
          isActive,
          activeStudioId,
          adjustmentValue,
          adjustmentType,
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
      const studioParam = selectedStudioId
        ? `&studioId=${selectedStudioId}`
        : "";
      fetch(
        `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}&roomId=${selectedRoot}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setBlockedSlots(data.blockedSlots || []);
          setPricingMap(data.pricingMap || {});
          setActionPending(false);
        });
    } else {
      const firstError =
        results.find((r) => !r.success)?.error || "Failed to save overrides";
      alert(firstError);
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

    for (const roomId of selectedBackdrops) {
      const targetRoomId = roomId;

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
      const studioParam = selectedStudioId
        ? `&studioId=${selectedStudioId}`
        : "";
      fetch(
        `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setBlockedSlots(data.blockedSlots || []);
          setPricingMap(data.pricingMap || {});
          setActionPending(false);
        });
    } else {
      alert("Failed to clear overrides");
      setActionPending(false);
    }
  };

  const handleBlockSelected = async () => {
    if (!selectedLocation || selectedSlots.length === 0) return;
    setActionPending(true);

    const studioInLocation = studios.find((s) => s.id === selectedStudioId);
    if (!studioInLocation) {
      setActionPending(false);
      return;
    }

    for (const slot of selectedSlots) {
      if (slot.isBlocked) {
        await unblockSlot(studioInLocation.id, slot.start, slot.end);
      } else {
        await blockSlot(studioInLocation.id, slot.start, slot.end);
      }
    }

    setEditingSlots(null);
    setSelectedSlots([]);

    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    const studioParam = selectedStudioId ? `&studioId=${selectedStudioId}` : "";
    fetch(
      `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setOverrides(data.overrides || []);
        setBlockedSlots(data.blockedSlots || []);
        setPricingMap(data.pricingMap || {});
        setActionPending(false);
      });
  };

  const handleResetToday = async () => {
    if (!selectedLocation || !selectedDate) return;
    if (
      !confirm(
        "Are you sure you want to reset ALL manual overrides for today? This will revert all slots to their standard price minus any active rules.",
      )
    )
      return;

    setActionPending(true);
    const res = await resetDailyOverrides(selectedLocation, selectedDate);
    if (res.success) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const studioParam = selectedStudioId
        ? `&studioId=${selectedStudioId}`
        : "";
      fetch(
        `/api/v1/locations/${selectedLocation}/overrides?date=${dateStr}${studioParam}&roomId=${selectedRoot}`,
      )
        .then((r) => r.json())
        .then((data) => {
          setOverrides(data.overrides || []);
          setPricingMap(data.pricingMap || {});
          setActionPending(false);
        });
    } else {
      alert(res.error || "Failed to reset overrides");
      setActionPending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Context Bar */}
      <div className="glass p-8 rounded-[2.5rem] relative z-40">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-6 w-full">
          {/* Physical Location */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Physical Location
            </label>
            <select
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-[52px] px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-bold text-sm"
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Studio Selection */}
          <div className="flex flex-col gap-2 min-w-[240px]">
            <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">
              Studio Selection
            </label>
            <div className="flex gap-1 bg-brand-black/5 dark:bg-brand-latte/5 p-1 rounded-2xl h-[52px] overflow-x-auto scrollbar-hide">
              {studios.map((studio) => (
                <button
                  key={studio.id}
                  onClick={() => {
                    setSelectedRoot(studio.roomId);
                    setSelectedStudioId(studio.id);
                  }}
                  className={cn(
                    "flex-1 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[100px]",
                    selectedStudioId === studio.id
                      ? "bg-white dark:bg-brand-blue dark:text-brand-latte shadow-lg text-brand-blue"
                      : "opacity-40 hover:opacity-100",
                    studio.isSpecial && "border border-brand-jasmine/30",
                  )}
                >
                  {studio.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Add-ons Today */}
          <div className="flex flex-col gap-2 relative group min-w-[180px]">
            <label className="text-[10px]  uppercase opacity-40 ml-2 tracking-widest">
              Active Add-ons Today
            </label>
            <div className="flex h-[52px] items-center px-6 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent hover:border-brand-jasmine/30 cursor-pointer transition-all group-hover:bg-brand-jasmine/5">
              <div className="flex items-center gap-3">
                <div className="flex h-2 w-2 rounded-full bg-brand-blue/80 animate-pulse" />
                <span className="text-xs  uppercase tracking-widest text-brand-black dark:text-brand-latte">
                  {activeAddons.length} Extras Active
                </span>
              </div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white dark:bg-[#111] rounded-[2rem] shadow-2xl border border-black/5 dark:border-white/10 p-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="text-[10px]  uppercase tracking-[0.2em] opacity-40 mb-4 ml-1">
                  Live Upsell Catalog
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
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
                          <span className="text-[9px]  opacity-30 uppercase tracking-widest">
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
                        <div className="shrink-0 px-2 py-1 rounded-lg bg-brand-jasmine/10 text-brand-jasmine text-[10px] ">
                          +${addon.price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <div className="text-[10px]  uppercase tracking-widest opacity-20">
                        No Extras Active Today
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reset Today Button */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <label className="text-[10px]  uppercase opacity-40 ml-2 tracking-widest">
              Emergency Tools
            </label>
            <button
              onClick={handleResetToday}
              disabled={actionPending}
              className="h-[52px] px-6 rounded-2xl bg-black/5 dark:bg-brand-latte/5 hover:bg-red-400 text-brand-black hover:text-brand-latte transition-all  text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" /> Reset Today
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-stretch">
        {/* Left: Calendar Picker */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <h2 className="text-2xl  tracking-tight">
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
              <span className=" uppercase tracking-widest text-sm">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px]  uppercase tracking-[0.2em] opacity-50 mb-4 px-2">
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
                      "h-12 rounded-2xl text-xs  transition-all flex flex-col items-center justify-center relative ",
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div className="flex flex-col">
              <h2 className="text-xl  tracking-tight uppercase opacity-90 truncate max-w-[300px]">
                {studios.find((s) => s.id === selectedStudioId)?.name ||
                  formatRoom(selectedRoot)}{" "}
                Slots
              </h2>
              <div className="h-1 w-12 bg-brand-blue rounded-full mt-1" />
            </div>

            <div className="flex bg-brand-black/5 dark:bg-white/5 rounded-2xl p-1.5 shrink-0 shadow-inner">
              <button
                onClick={() => {
                  setOperationalMode("OVERRIDES");
                  setSelectedSlots([]);
                }}
                className={cn(
                  "px-5 py-2 text-[10px]  uppercase tracking-widest rounded-xl transition-all",
                  operationalMode === "OVERRIDES"
                    ? "bg-white dark:bg-[#111] text-brand-blue shadow-lg scale-105"
                    : "opacity-40 hover:opacity-100",
                )}
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  setOperationalMode("BLOCKING");
                  setSelectedSlots([]);
                }}
                className={cn(
                  "px-5 py-2 text-[10px]  uppercase tracking-widest rounded-xl transition-all",
                  operationalMode === "BLOCKING"
                    ? "bg-white dark:bg-[#111] text-red-500 shadow-lg scale-105"
                    : "opacity-40 hover:opacity-100",
                )}
              >
                Blocking
              </button>
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
                    data.isBlocked &&
                      "opacity-40 grayscale bg-brand-black/5 dark:bg-white/5 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {data.isBlocked && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-brand-black/20 dark:bg-white/20">
                      <span className="text-[7px]  uppercase tracking-widest opacity-60">
                        {data.blockedReason === "RESERVATION"
                          ? "SOLD"
                          : "LOCKED"}
                      </span>
                    </div>
                  )}
                  <div className=" text-xl flex items-baseline gap-[1px] leading-none">
                    {hour > 12 ? hour - 12 : hour}
                    <span className="text-[10px] uppercase opacity-50 font-bold">
                      {hour >= 12 ? "PM" : "AM"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col items-center justify-center leading-none">
                    {data.hierarchy?.finalPrice !== undefined && (
                      <div className="flex flex-col items-center">
                        <div className="text-sm  text-brand-blue dark:text-brand-jasmine leading-none">
                          ${data.hierarchy.finalPrice}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center">
                      {/* Hover Tooltip for Discounts */}
                      {isActive &&
                        (hasOverrideStyle ||
                          discount !== 0 ||
                          data.hierarchy?.ruleApplied) && (
                          <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-max max-w-[240px] bg-white/95 dark:bg-brand-black/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100">
                            <div className="space-y-2">
                              {[
                                (() => {
                                  if (!hasOverrideStyle) return null;
                                  const s = styles.find(
                                    (s) =>
                                      s.id === data.override?.activeStudioId,
                                  );
                                  if (
                                    s?.roomId === selectedRoot &&
                                    !s?.isSpecial
                                  )
                                    return null;
                                  return (
                                    <div
                                      key="studio"
                                      className="flex justify-between items-center gap-6"
                                    >
                                      <span className="text-[10px]  uppercase tracking-wider opacity-40">
                                        Backdrop:
                                      </span>
                                      <span className="text-[11px]  text-brand-black dark:text-brand-jasmine">
                                        {s?.name || "Custom"}
                                      </span>
                                    </div>
                                  );
                                })(),
                                (() => {
                                  if (
                                    !data.override ||
                                    data.override.discount === 0 ||
                                    (data.override as any).isVirtual
                                  )
                                    return null;
                                  const type =
                                    data.override.adjustmentType ||
                                    "fixed_amount";
                                  const val = data.override.discount;
                                  return (
                                    <div
                                      key="override"
                                      className="flex justify-between items-center gap-6"
                                    >
                                      <span className="text-[10px]  uppercase tracking-wider opacity-40 text-brand-blue">
                                        Manual:
                                      </span>
                                      <div className="flex flex-col items-end">
                                        <span className="text-[11px]  text-brand-blue">
                                          {type === "fixed_override"
                                            ? `SET $${val}`
                                            : `${val > 0 ? "+" : ""}${type === "percentage" ? val + "%" : val + "$"}`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })(),
                                (() => {
                                  if (
                                    !data.hierarchy?.ruleApplied ||
                                    data.hierarchy.ruleApplied
                                      .adjustmentValue === 0
                                  )
                                    return null;
                                  const r = data.hierarchy.ruleApplied;
                                  const val = r.adjustmentValue;
                                  return (
                                    <div
                                      key="rule"
                                      className="flex justify-between items-center gap-6"
                                    >
                                      <span className="text-[10px]  uppercase tracking-wider opacity-40">
                                        Rule ({r.name}):
                                      </span>
                                      <span className="text-[11px]  text-emerald-600 dark:text-emerald-400">
                                        {r.adjustmentType === "fixed_override"
                                          ? `SET $${val}`
                                          : `${val > 0 ? "+" : ""}${r.adjustmentType === "percentage" ? val + "%" : val + "$"}`}
                                      </span>
                                    </div>
                                  );
                                })(),
                              ].filter(Boolean)}
                            </div>
                            {/* Decorative arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-white/95 dark:border-t-brand-black/95" />
                          </div>
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
              onClick={() => {
                if (operationalMode === "BLOCKING") {
                  if (selectedSlots.length === 0) return;
                  handleBlockSelected();
                } else {
                  if (selectedSlots.length > 0) {
                    setEditingSlots(selectedSlots);
                    setSelectedRuleHours(selectedSlots.map((s) => s.hour));
                    setIsWholeDay(false);
                    setIsRecurring(false);
                    setConfigMode("STANDARD");

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
                  } else {
                    // Create Scheduled Promo Path (No Slots)
                    setEditingSlots([]); // Marker for Global Promo
                    setSelectedRuleHours([]);
                    setIsWholeDay(true);
                    setIsRecurring(true);
                    setConfigMode("RECURRING");
                    setSelectedBackdrops([selectedRoot]);
                  }
                }
              }}
              className={cn(
                "w-full py-4  rounded-2xl transition-all uppercase tracking-widest text-sm",
                selectedSlots.length > 0
                  ? operationalMode === "BLOCKING"
                    ? "bg-red-500 text-white shadow-xl shadow-red-500/30 hover:bg-red-600 active:scale-[0.98]"
                    : "bg-brand-blue text-brand-latte shadow-xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98]"
                  : operationalMode === "BLOCKING"
                    ? "bg-brand-black/5 dark:bg-brand-latte/5 text-black/30 dark:text-brand-latte/30 cursor-not-allowed"
                    : "bg-brand-blue text-brand-latte shadow-xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98]",
              )}
            >
              {selectedSlots.length > 0
                ? operationalMode === "BLOCKING"
                  ? `Toggle Block for Selected (${selectedSlots.length})`
                  : `Configure Selected (${selectedSlots.length})`
                : operationalMode === "BLOCKING"
                  ? "Select timeslot to block"
                  : "Create Scheduled Promo"}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="glass w-full max-w-xl rounded-[3.5rem] overflow-hidden">
                <div className="pt-10 px-10 pb-2">
                  <div className="flex justify-between">
                    <h2 className="text-2xl  tracking-tight leading-none">
                      {editingSlots.length === 0
                        ? "Create Scheduled Promo"
                        : configMode === "RECURRING"
                          ? "Configure Recurring"
                          : configMode === "SPECIAL"
                            ? "Configure Special"
                            : editingSlots.length > 1
                              ? `Configure ${editingSlots.length} Slots`
                              : "Configure Slot"}
                    </h2>
                    <button
                      onClick={() => setEditingSlots(null)}
                      className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-all"
                    >
                      <X className="w-6 h-6 opacity-20 hover:opacity-100" />
                    </button>
                  </div>

                  <div className="flex items-center gap-10">
                    {/* Date Block */}
                    {editingSlots.length > 0 && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-brand-blue/40" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px]  uppercase tracking-[0.2em] opacity-20">
                            Configuration Date
                          </span>
                          <span className="text-[11px]  uppercase tracking-[0.05em] opacity-60">
                            {selectedDate
                              ? format(selectedDate, "EEEE, MMMM do, yyyy")
                              : "Select a date"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Active Rules Info */}
                    {editingSlots.length === 1 && (
                      <>
                        {/* Logic Block - Only show if rules exist */}
                        {editingSlots[0].pricingRules &&
                          editingSlots[0].pricingRules.length > 0 && (
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4 text-brand-blue/40" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px]  uppercase tracking-[0.2em] text-brand-blue opacity-50">
                                  Applied Logic
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {editingSlots[0].pricingRules.map(
                                    (rule: any) => (
                                      <span
                                        key={rule.id}
                                        className="text-[11px]  uppercase tracking-[0.05em] opacity-60"
                                      >
                                        {rule.name}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Status Block */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-brand-blue/40" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px]  uppercase tracking-[0.2em] opacity-20">
                              Current discounts
                            </span>
                            <span className="text-[11px]  uppercase tracking-[0.05em] opacity-60">
                              {editingSlots[0].pricingRules?.length || 0} Active
                              Discounts
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {editingSlots.length === 0 && (
                  <div className="px-10 pt-2 pb-2 flex gap-2">
                    {["RECURRING", "SPECIAL"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setConfigMode(
                            m as "STANDARD" | "SPECIAL" | "RECURRING",
                          );
                          if (m === "RECURRING") setIsRecurring(true);
                        }}
                        className={cn(
                          "flex-1 py-3 text-[10px]  uppercase tracking-widest rounded-xl transition-all",
                          configMode === m
                            ? "bg-brand-blue text-white shadow-lg"
                            : "bg-brand-black/5 dark:bg-white/5 opacity-50 hover:opacity-100",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                <div className="h-px w-full bg-black/5 dark:bg-white/5" />

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {(configMode === "STANDARD" ||
                    configMode === "RECURRING") && (
                    <form
                      action={
                        isRecurring ? handleCreateScopedPromo : saveSlotOverride
                      }
                      className="p-10 pt-2 space-y-6"
                    >
                      {isRecurring && (
                        <input
                          type="hidden"
                          name="ruleType"
                          value="RECURRING"
                        />
                      )}
                      <div className="space-y-6">
                        {isRecurring && (
                          <div className="space-y-1.5">
                            <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-1">
                              Template Name
                            </label>
                            <input
                              name="name"
                              required
                              placeholder="e.g. Standard Recurring Rule"
                              className="w-full px-4 py-4 rounded-2xl bg-brand-black/5 dark:bg-white/5 outline-none font-bold text-brand-blue/80 dark:text-brand-jasmine border-2 border-transparent focus:border-brand-blue/20 transition-all"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                            <label className="text-[10px]  uppercase tracking-widest opacity-40 block mb-2 ml-1">
                              Discount ($)
                            </label>
                            <input
                              type="number"
                              name="adjustmentValue"
                              placeholder="e.g. 10"
                              step="any"
                              defaultValue={
                                singleSlotOverride
                                  ? Math.abs(singleSlotOverride.discount)
                                  : 0
                              }
                              required
                              className="w-full bg-transparent outline-none font-mono font-bold text-2xl text-brand-blue/80 dark:text-brand-jasmine"
                            />
                            <input
                              type="hidden"
                              name="adjustmentType"
                              value="fixed_amount"
                            />
                          </div>

                          {isRecurring && (
                            <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl flex flex-col justify-center">
                              <label className="text-[10px]  uppercase tracking-widest opacity-40 block mb-2 ml-1">
                                Lifespan
                              </label>
                              <select
                                name="lifespan"
                                className="w-full bg-transparent  text-xs tracking-widest uppercase outline-none appearance-none cursor-pointer"
                              >
                                <option value="forever">Forever</option>
                                <option value="1_month">1 Month</option>
                                <option value="3_months">3 Months</option>
                                <option value="12_months">12 Months</option>
                              </select>
                            </div>
                          )}
                          {!isRecurring && (
                            <div className="flex items-center justify-between p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                              <div className="space-y-1">
                                <label className="text-[10px]  uppercase tracking-widest opacity-40">
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
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-2">
                            Studio
                          </label>
                          <div className="flex gap-2">
                            {roomTypes.map((type) => {
                              const isSelected =
                                selectedBackdrops.includes(type);
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
                                  <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs  uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                                    {formatRoom(type)}
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

                        <div className="space-y-2 border-t border-black/5 dark:border-white/5 pt-6">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-2">
                              Selected Timeslots
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer mr-2">
                              <input
                                type="checkbox"
                                checked={isWholeDay}
                                onChange={(e) =>
                                  setIsWholeDay(e.target.checked)
                                }
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
                                const isSelected =
                                  selectedRuleHours.includes(hour);
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
                                      "py-2.5 rounded-xl text-[10px]  uppercase tracking-wider transition-all border flex items-center justify-center",
                                      isSelected
                                        ? "bg-brand-blue border-brand-blue text-white shadow-md shadow-brand-blue/30 scale-105 z-10 relative"
                                        : "bg-brand-black/10 dark:bg-white/10 border-transparent text-brand-black/60 dark:text-white/60 hover:bg-brand-black/20 dark:hover:bg-white/20",
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
                            <div className="w-full py-4 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-brand-blue/20 text-center text-brand-blue/80 text-xs  uppercase tracking-widest">
                              All {SLOT_TIMES.length} Timeslots Selected
                            </div>
                          )}
                        </div>

                        {isRecurring && (
                          <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-1">
                                Days of Week
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer mr-1">
                                <input
                                  type="checkbox"
                                  className="peer rounded"
                                  onChange={(e) => {
                                    const cbs = document.querySelectorAll(
                                      'input[name="daysOfWeek"]',
                                    ) as NodeListOf<HTMLInputElement>;
                                    cbs.forEach(
                                      (cb) => (cb.checked = e.target.checked),
                                    );
                                  }}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 peer-checked:opacity-100 peer-checked:text-brand-blue transition-all">
                                  Whole week
                                </span>
                              </label>
                            </div>
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
                                  <div className="h-full flex items-center justify-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-white transition-all text-xs  uppercase border border-transparent peer-checked:border-brand-blue">
                                    <span className="opacity-60 peer-checked:opacity-100">
                                      {day.label}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
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
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-black/5 dark:border-white/5 flex gap-4">
                        {!isRecurring && (
                          <button
                            type="button"
                            onClick={handleClearOverrides}
                            disabled={actionPending}
                            className="flex-1 py-6 bg-brand-black/5 dark:bg-brand-latte/5 text-black/40 dark:text-brand-latte/40  rounded-[2rem] hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.2em]"
                          >
                            Reset to Default
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={actionPending}
                          className={cn(
                            "py-6 bg-brand-blue text-brand-latte  rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]",
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
                          <div className="flex flex-col gap-4">
                            <div className="p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl">
                              <label className="text-[10px]  uppercase tracking-widest opacity-40 block mb-2 ml-1">
                                Discount ($)
                              </label>
                              <input
                                name="adjustmentValue"
                                type="number"
                                placeholder="e.g. 15"
                                step="any"
                                defaultValue={0}
                                className="w-full bg-transparent outline-none  text-2xl text-brand-blue/80 dark:text-brand-jasmine"
                              />
                              <input
                                type="hidden"
                                name="adjustmentType"
                                value="fixed_amount"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-2">
                            Backdrop Overlay
                          </label>
                          <div className="flex gap-2">
                            {roomTypes.map((type) => {
                              const isSelected =
                                selectedBackdrops.includes(type);
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
                                  <div className="py-3 text-center rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 peer-checked:bg-brand-blue peer-checked:text-brand-latte transition-all text-xs  uppercase tracking-widest border border-transparent peer-checked:border-brand-blue shadow-sm">
                                    {formatRoom(type)}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          <input
                            type="hidden"
                            name="ruleType"
                            value="SPECIAL"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={actionPending}
                        className="w-full py-6 bg-brand-blue text-brand-latte  rounded-[2rem] shadow-2xl shadow-brand-blue/40 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-[0.2em]"
                      >
                        {actionPending ? "Building Bounds..." : `Apply config`}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
