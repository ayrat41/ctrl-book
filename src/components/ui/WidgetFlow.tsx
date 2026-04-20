"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Tag,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
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
} from "date-fns";

// Types
import type { Location, Studio } from "@prisma/client";

export default function WidgetFlow() {
  const [step, setStep] = useState<number>(1);

  // Base State
  const [locations, setLocations] = useState<(Location & { address: any })[]>(
    [],
  );
  const [studios, setStudios] = useState<Studio[]>([]);
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [loadingLocs, setLoadingLocs] = useState<boolean>(true);

  // Selection State
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);

  // Cart State
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<
    { start: Date; end: Date }[]
  >([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number }[]
  >([]);

  // Quote State
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [promos, setPromos] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [inactiveSlots, setInactiveSlots] = useState<any[]>([]);
  const [slotOverrides, setSlotOverrides] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Fetch initial locations
  useEffect(() => {
    fetch("/api/v1/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
        setLoadingLocs(false);
      });

    // Fetch global addons
    fetch("/api/v1/addons")
      .then((res) => res.json())
      .then((data) => setAvailableAddons(data))
      .catch(console.error);
  }, []);

  // Fetch studios when a location is picked OR date changes
  useEffect(() => {
    if (selectedLocation) {
      const dateParam = selectedDate
        ? `?date=${format(selectedDate, "yyyy-MM-dd")}`
        : "";
      fetch(`/api/v1/locations/${selectedLocation}/studios${dateParam}`)
        .then((res) => res.json())
        .then((data) => {
          setStudios(Array.isArray(data) ? data : []);

          // Logic: If the currently selected studio is no longer in the filtered list,
          // switch selection to the first available studio.
          if (data.length > 0) {
            const stillExists = data.find((s) => s.id === selectedStudio);
            if (!stillExists) {
              setSelectedStudio(data[0].id);
            }
          } else {
            setSelectedStudio(null);
          }
        });
    }
  }, [selectedLocation, selectedDate]);

  // Fetch promos when studio changes
  useEffect(() => {
    if (selectedStudio) {
      fetch(`/api/v1/studios/${selectedStudio}/promos`)
        .then((res) => res.json())
        .then((data) => setPromos(data))
        .catch(console.error);
    }
  }, [selectedStudio]);

  // Fetch availability when date changes
  useEffect(() => {
    if (selectedStudio && selectedDate) {
      setLoadingSlots(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      fetch(`/api/v1/studios/${selectedStudio}/availability?date=${dateStr}`)
        .then((res) => res.json())
        .then((data) => {
          setBlockedSlots(data.blockedSlots || []);
          setInactiveSlots(data.inactiveSlots || []);
          setSlotOverrides(data.overrides || []);
          setLoadingSlots(false);
        })
        .catch(() => setLoadingSlots(false));
    }
  }, [selectedStudio, selectedDate]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  // Calendar Math
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startingDayIndex = getDay(startOfMonth(currentMonth));

  const getAvailableSlotsForDate = () => {
    if (!selectedDate) return [];
    const durationMins =
      studios.find((s) => s.id === selectedStudio)?.sessionDuration || 45;
    const slots = [];
    // Generating dynamic slots every hour from 9 AM to 8 PM
    for (let hour = 9; hour <= 20; hour++) {
      const start = new Date(selectedDate);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(hour, durationMins, 0, 0);

      const isInactive = inactiveSlots.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return start < bEnd && end > bStart;
      });

      if (isInactive) continue;

      const isBlocked = blockedSlots.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return start < bEnd && end > bStart;
      });

      if (start < new Date()) continue; // Past

      if (!isBlocked) {
        slots.push({ start, end });
      }
    }
    return slots;
  };

  const calculateSlotPrice = (slot: { start: Date; end: Date }) => {
    const override = slotOverrides.find(
      (o) => new Date(o.startTime).getTime() === slot.start.getTime(),
    );

    return override?.calculatedPrice || 0;
  };

  const totalPrice =
    selectedTimeSlots.reduce((acc, slot) => acc + calculateSlotPrice(slot), 0) +
    selectedAddOns.reduce((acc, addon) => acc + addon.price, 0);
  const availableSlots = getAvailableSlotsForDate();

  const calculateBaseSlotPrice = (slot: { start: Date; end: Date }) => {
    const override = slotOverrides.find(
      (o) => new Date(o.startTime).getTime() === slot.start.getTime(),
    );
    return override?.basePrice || 0;
  };

  const totalBasePrice = selectedTimeSlots.reduce(
    (acc, slot) => acc + calculateBaseSlotPrice(slot),
    0,
  );
  
  const totalSlotPrice = selectedTimeSlots.reduce(
    (acc, slot) => acc + calculateSlotPrice(slot),
    0,
  );
  const totalDiscount = Math.max(0, totalBasePrice - totalSlotPrice);

  const getWatchSlot = (num: number) => {
    if (!selectedDate) return { slot: null, inactive: false };
    const durationMins =
      studios.find((s) => s.id === selectedStudio)?.sessionDuration || 45;
    const hour = num >= 9 && num <= 11 ? num : num === 12 ? 12 : num + 12;
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(hour, durationMins, 0, 0);

    if (start < new Date()) return { slot: null, inactive: false }; // Past

    const isInactive = inactiveSlots.some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return start < bEnd && end > bStart;
    });

    if (isInactive) return { slot: null, inactive: true };

    const isBlocked = blockedSlots.some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return start < bEnd && end > bStart;
    });

    if (isBlocked) return { slot: null, inactive: false };
    return { slot: { start, end }, inactive: false };
  };

  const toggleSlotSelection = (slot: { start: Date; end: Date }) => {
    // Check if already selected
    const exists = selectedTimeSlots.find(
      (s) => s.start.getTime() === slot.start.getTime(),
    );
    if (exists) {
      setSelectedTimeSlots(
        selectedTimeSlots.filter(
          (s) => s.start.getTime() !== slot.start.getTime(),
        ),
      );
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  const toggleAddOn = (addon: any) => {
    const exists = selectedAddOns.find((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  // Generate Quote
  const generateQuote = async () => {
    if (selectedTimeSlots.length === 0) return;
    setLoadingQuote(true);
    handleNext(); // go to step 3

    try {
      const res = await fetch("/api/v1/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: selectedStudio,
          timeSlots: selectedTimeSlots,
          addOns: selectedAddOns,
        }),
      });
      const data = await res.json();
      setQuoteData(data);
    } catch (err) {
      console.error("Quote fetch err", err);
    } finally {
      setLoadingQuote(false);
    }
  };

  return (
    <div className={cn(Theme.classes.widgetWrapper, Theme.classes.widgetGlass)}>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between z-10 relative">
        <h2 className="text-2xl font-bold tracking-tight">
          {step === 1 && "Choose a Location"}
          {step === 2 && (locations.find((l) => l.id === selectedLocation)?.name || "Select Sessions")}
          {step === 3 && "Final Details & Quote"}
        </h2>
        {step > 1 && (
          <button
            onClick={handleBack}
            className="text-sm font-medium hover:opacity-70 transition-colors bg-white/20 dark:bg-brand-latte/10 px-3 py-1 rounded-full"
          >
            Back
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: LOCATIONS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2 opacity-60">
                Our Studios
              </h3>
              {loadingLocs ? (
                <div className="animate-pulse space-y-4 py-1">
                  <div className="h-20 bg-neutral-200/50 dark:bg-brand-latte/5 rounded-xl"></div>
                </div>
              ) : (
                locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc.id);
                      handleNext();
                    }}
                    className="w-full text-left p-5 rounded-2xl bg-white/40 dark:bg-brand-latte/5 border border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 hover:scale-[1.01] transition-all group flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-xl">{loc.name}</p>
                      <p className="text-sm mt-1 flex items-center gap-1 opacity-70">
                        <MapPin className="w-4 h-4" /> {loc.address?.city},{" "}
                        {loc.address?.state}
                      </p>
                    </div>
                    <div className="bg-white/40 dark:bg-brand-latte/5 p-2 rounded-full group-hover:bg-brand-black group-hover:text-brand-latte dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}

          {/* STEP 2: MULTI-SLOT CART & CALENDAR */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {/* Studio Toggle Bar */}
              <div className="flex bg-white/40 dark:bg-brand-latte/5 p-1 rounded-2xl overflow-x-auto hide-scrollbar whitespace-nowrap shadow-inner border border-white/20 dark:border-white/5">
                {studios.map((studio) => (
                  <button
                    key={studio.id}
                    onClick={() => setSelectedStudio(studio.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex-1 min-w-[90px] sm:min-w-[120px]",
                      selectedStudio === studio.id
                        ? "bg-brand-black text-brand-latte dark:bg-brand-latte dark:text-brand-black shadow-lg"
                        : "text-neutral-600 hover:bg-white/50 dark:text-neutral-400 dark:hover:bg-white/10",
                    )}
                  >
                    {studio.name}
                  </button>
                ))}
              </div>

              {/* Main Calendar Stack */}
              <div className="flex flex-col gap-3 sm:gap-6 bg-white/40 dark:bg-brand-latte/5 p-3 sm:p-5 rounded-2xl border border-white/20">
                {/* Visual Calendar (Top) */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold relative">
                        {format(currentMonth, "MMMM yyyy")}
                      </h3>
                      {promos.length > 0 && (
                        <div className="hidden sm:flex flex-col items-start gap-0.5 border-l border-black/10 dark:border-white/10 pl-4">
                          <p className="text-[11px] font-bold text-brand-blue dark:text-brand-jasmine dark:text-brand-blue dark:text-brand-jasmine flex items-center gap-1.5 whitespace-nowrap">
                            <Tag className="w-3 h-3" /> {promos[0].name}
                          </p>
                          <p className="text-[10px] opacity-80 whitespace-nowrap">
                            {promos[0].discountType === "percentage"
                              ? `${promos[0].discountValue}% off applies automatically!`
                              : `$${promos[0].discountValue} off per hour applies automatically!`}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentMonth(subMonths(currentMonth, 1))
                        }
                        className="p-1 hover:bg-brand-black/10 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() =>
                          setCurrentMonth(addMonths(currentMonth, 1))
                        }
                        className="p-1 hover:bg-brand-black/10 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold opacity-60 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startingDayIndex }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2" />
                    ))}
                    {daysInMonth.map((day) => {
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const isSelected =
                        selectedDate && isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toISOString()}
                          disabled={isPast}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "p-2 rounded-xl text-sm font-medium transition-all transition-transform",
                            isPast
                              ? "opacity-20 cursor-not-allowed"
                              : "hover:bg-brand-black/10 dark:hover:bg-white/10 active:scale-95",
                            isSelected &&
                              "bg-black text-brand-latte dark:bg-brand-latte dark:text-brand-black shadow-md hover:bg-brand-black dark:hover:bg-white",
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Time Slots & Summary */}
                <div className="w-full flex flex-col gap-3 mt-2 sm:mt-4 items-center">
                  {/* Top Side: Time Slot Grid */}
                  <div className="w-full relative">
                    {!selectedDate ? (
                      <div className="w-full min-h-[140px] sm:h-[230px] rounded-2xl border-[2px] border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center opacity-50 bg-brand-black/5 dark:bg-brand-latte/5">
                        <Clock className="w-8 h-8 opacity-30 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                          Select a date
                        </span>
                      </div>
                    ) : loadingSlots ? (
                      <div className="w-full min-h-[140px] sm:h-[230px] rounded-2xl border-[2px] border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center bg-brand-black/5 dark:bg-brand-latte/5">
                        <div className="w-6 h-6 border-[3px] border-black/50 dark:border-white/50 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full">
                        {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                          const { slot, inactive } = getWatchSlot(num);

                          if (inactive) return null; // Completely hide inactivated slots

                          const isAvailable = slot !== null;
                          const isSelected =
                            isAvailable &&
                            selectedTimeSlots.some(
                              (s) => s.start.getTime() === slot.start.getTime(),
                            );

                          const price = isAvailable
                            ? calculateSlotPrice(slot)
                            : 0;

                          return (
                            <button
                              key={num}
                              disabled={!isAvailable}
                              onClick={() =>
                                isAvailable && toggleSlotSelection(slot)
                              }
                              className={cn(
                                "flex flex-col items-center justify-center py-1.5 sm:py-3 px-1 rounded-xl transition-all duration-300 font-bold border",
                                !isAvailable &&
                                  "opacity-30 cursor-not-allowed bg-brand-black/5 dark:bg-brand-latte/5 border-transparent",
                                isAvailable &&
                                  !isSelected &&
                                  "hover:bg-brand-black/5 dark:hover:bg-white/5 bg-white/70 dark:bg-brand-latte/10 border-black/10 dark:border-white/10 shadow-sm active:scale-[0.98]",
                                isSelected &&
                                  "bg-brand-blue hover:bg-brand-jasmine text-brand-latte shadow-lg border-brand-blue",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-sm sm:text-lg leading-none mb-0.5 sm:mb-1",
                                  isSelected ? "text-brand-latte" : "",
                                )}
                              >
                                {num}:00
                              </span>
                              {isAvailable && (
                                <span
                                  className={cn(
                                    "text-[9px] sm:text-[11px] uppercase font-bold tracking-wider",
                                    isSelected
                                      ? "text-brand-latte/90"
                                      : "text-brand-blue dark:text-brand-jasmine",
                                  )}
                                >
                                  ${price.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Middle Side: Add-ons Dropdown */}
                  {availableAddons.length > 0 && (
                    <div className="w-full pt-1 pb-1 border-t border-black/5 dark:border-white/5">
                      <details className="group">
                        <summary className="flex justify-between items-center cursor-pointer p-3 rounded-xl bg-white/40 dark:bg-brand-latte/5 border border-black/10 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-colors font-semibold text-sm outline-none list-none [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center gap-2 w-full">
                            <Plus className="w-4 h-4 group-open:rotate-45 transition-transform opacity-70" />
                            <span className="text-emerald-700 dark:text-brand-jasmine">
                              Enhance your session!
                            </span>
                            {selectedAddOns.length > 0 && (
                              <span className="bg-brand-blue text-brand-latte text-[10px] px-2 py-0.5 rounded-full ml-auto shadow-sm">
                                {selectedAddOns.length} Selected
                              </span>
                            )}
                          </span>
                        </summary>
                        <div className="flex flex-col gap-2 pt-2 pb-1 overflow-y-auto max-h-[160px] hide-scrollbar rounded-xl">
                          {availableAddons.map((addon) => {
                            const isSelected = selectedAddOns.some(
                              (a) => a.id === addon.id,
                            );
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddOn(addon)}
                                className={cn(
                                  "flex-none flex items-center justify-between gap-3 p-3 rounded-xl border text-sm font-semibold transition-all text-left",
                                  isSelected
                                    ? "border-black bg-brand-black/5 dark:bg-brand-latte/10 dark:border-white shadow-sm"
                                    : "border-black/5 hover:border-black/20 dark:border-white/5 dark:hover:border-white/20 bg-white/20 dark:bg-brand-latte/5",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full flex flex-shrink-0 items-center justify-center transition-colors relative",
                                      isSelected
                                        ? "border-0 bg-transparent"
                                        : "border border-black/20 dark:border-white/20",
                                    )}
                                  >
                                    {isSelected && (
                                      <CheckCircle2 className="w-5 h-5 text-brand-blue absolute inset-auto" />
                                    )}
                                  </div>
                                  <span className="leading-tight text-xs whitespace-nowrap">
                                    {addon.name}
                                  </span>
                                </div>
                                <span className="opacity-80 text-xs whitespace-nowrap font-mono">
                                  +${addon.price.toFixed(2)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Bottom Side: Itemized Receipt & Checkout */}
                  <div className="w-full flex flex-col justify-center border-t border-black/10 dark:border-white/10 pt-3 sm:pt-6 mt-1 sm:mt-2">
                    {selectedTimeSlots.length > 0 ? (
                      <div className="w-full flex flex-col gap-2 font-mono text-sm mx-auto">
                        <div className="flex justify-between items-center opacity-80">
                          <span>
                            Studio Sessions ({selectedTimeSlots.length})
                          </span>
                          <span>
                            $
                            {selectedTimeSlots
                              .reduce(
                                (acc, slot) => acc + calculateSlotPrice(slot),
                                0,
                              )
                              .toFixed(2)}
                          </span>
                        </div>

                        {selectedAddOns.map((addon) => (
                          <div
                            key={addon.id}
                            className="flex justify-between items-center opacity-70 text-xs"
                          >
                            <span className="truncate pr-2">{addon.name}</span>
                            <span className="flex-shrink-0">
                              + ${addon.price.toFixed(2)}
                            </span>
                          </div>
                        ))}

                        {totalDiscount > 0 && (
                          <div className="flex justify-between items-center text-brand-blue dark:text-brand-jasmine">
                            <span>Discount</span>
                            <span>- ${totalDiscount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="border-t border-black/20 dark:border-white/20 my-2"></div>

                        <div className="flex justify-between items-center text-xl font-bold mb-4 tracking-tight text-brand-blue dark:text-brand-jasmine font-sans">
                          <span>TOTAL</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={generateQuote}
                          className={Theme.classes.primaryButton}
                        >
                          Checkout
                        </button>
                      </div>
                    ) : (
                      <div className="opacity-30 text-xs font-semibold tracking-widest uppercase text-center w-full py-4 sm:min-h-[160px] flex items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20 rounded-2xl">
                        Select slots to view cart
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: QUOTE & CHECKOUT */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-6 bg-white/40 dark:bg-brand-latte/5 rounded-2xl border border-white/30 dark:border-white/10 shadow-lg">
                <h3 className="font-bold text-xl mb-4 flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                  Cart Summary
                  <span className="text-xs font-normal opacity-70 bg-brand-black/10 dark:bg-brand-latte/10 px-2 py-1 rounded-full">
                    {selectedTimeSlots.length} Appt
                    {selectedTimeSlots.length > 1 ? "s" : ""}
                  </span>
                </h3>

                {loadingQuote || !quoteData ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4 text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="opacity-70 text-xs uppercase tracking-widest font-bold">
                        Base Cost
                      </span>
                      <div className="flex justify-between text-base">
                        <span>
                          {studios.find((s) => s.id === selectedStudio)?.name} (
                          {quoteData.slotsCount} Appts)
                        </span>
                        <span>${quoteData.basePrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedAddOns.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-black/5 dark:border-white/5 pt-3">
                        <span className="opacity-70 text-xs uppercase tracking-widest font-bold">
                          Add-ons
                        </span>
                        {selectedAddOns.map((addon) => (
                          <div
                            key={addon.id}
                            className="flex justify-between text-sm opacity-90"
                          >
                            <span>{addon.name}</span>
                            <span>+ ${addon.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {quoteData.bestDiscount > 0 && (
                      <div className="flex flex-col gap-1 border-t border-black/5 dark:border-white/5 pt-3">
                        <div className="flex justify-between items-center text-brand-blue dark:text-brand-jasmine dark:text-brand-blue dark:text-brand-jasmine font-bold bg-brand-blue hover:bg-brand-jasmine/10 p-3 rounded-xl">
                          <span>✨ Active Promotion Applied</span>
                          <span>-${quoteData.bestDiscount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="border-t-2 border-black/20 dark:border-white/20 pt-4 mt-2 flex justify-between items-center font-black text-2xl">
                      <span>Total</span>
                      <span>${quoteData.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/20 dark:bg-brand-black/40 p-4 rounded-2xl border border-white/20 space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full p-4 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full p-4 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>

              <button
                disabled={loadingQuote || !quoteData || !fullName}
                className={Theme.classes.secondaryButton}
              >
                Complete Payment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
