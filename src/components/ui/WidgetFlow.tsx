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
  CheckCircle2,
  Ticket,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
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
import { createCheckoutSession } from "@/app/actions/booking-actions";

// Types
import type { Location, Studio } from "@prisma/client";

export default function WidgetFlow() {
  const [step, setStep] = useState<number>(1);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    { start: Date; end: Date; price?: number; basePrice?: number }[]
  >([]);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number }[]
  >([]);

  // Quote State
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [promos, setPromos] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [inactiveSlots, setInactiveSlots] = useState<any[]>([]);
  const [slotOverrides, setSlotOverrides] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Marketing / Promo State
  const [utmParams, setUtmParams] = useState<{
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
  }>({ utm_source: "", utm_medium: "", utm_campaign: "" });
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<
    "idle" | "loading" | "valid" | "invalid"
  >("idle");
  const [promoRule, setPromoRule] = useState<any>(null);
  const [promoError, setPromoError] = useState("");

  // Parse UTM params from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUtmParams({
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
      });
    }
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus("loading");
    setPromoError("");
    setPromoRule(null);
    try {
      const res = await fetch("/api/v1/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (data.valid && data.rule) {
        setPromoStatus("valid");
        setPromoRule(data.rule);
      } else {
        setPromoStatus("invalid");
        setPromoError(data.error || "Invalid promo code.");
      }
    } catch {
      setPromoStatus("invalid");
      setPromoError("Could not validate promo code. Please try again.");
    }
  };

  const clearPromo = () => {
    setPromoCode("");
    setPromoStatus("idle");
    setPromoRule(null);
    setPromoError("");
  };

  useEffect(() => {
    fetch("/api/v1/locations")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
        setLoadingLocs(false);
      });
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      const dateParam = selectedDate
        ? `?date=${format(selectedDate, "yyyy-MM-dd")}`
        : "";
      fetch(`/api/v1/locations/${selectedLocation}/studios${dateParam}`)
        .then((res) => res.json())
        .then((data) => {
          setStudios(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            const stillExists = data.find((s: any) => s.id === selectedStudio);
            if (!stillExists) {
              setSelectedStudio(data[0].id);
            }
          } else {
            setSelectedStudio(null);
          }
        });
    }
    const dateParam = selectedDate
      ? `?date=${format(selectedDate, "yyyy-MM-dd")}`
      : "";
    fetch(`/api/v1/addons${dateParam}`)
      .then((res) => res.json())
      .then((data) => setAvailableAddons(data))
      .catch(console.error);
  }, [selectedLocation, selectedDate]);

  useEffect(() => {
    if (selectedStudio) {
      fetch(`/api/v1/studios/${selectedStudio}/promos`)
        .then((res) => res.json())
        .then((data) => setPromos(data))
        .catch(console.error);
    }
  }, [selectedStudio]);

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
        .catch((err) => {
          console.error("[WIDGET] Availability fetch error:", err);
          setLoadingSlots(false);
        });
    }
  }, [selectedStudio, selectedDate]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startingDayIndex = getDay(startOfMonth(currentMonth));

  const getAvailableSlotsForDate = () => {
    if (!selectedDate || slotOverrides.length === 0) return [];
    const slots: {
      start: Date;
      end: Date;
      status: "available" | "soldOut" | "past";
    }[] = [];

    slotOverrides.forEach((override) => {
      const start = new Date(override.startTime);
      const end = new Date(override.endTime);

      if (override.isActive === false) return;

      const isInactive = inactiveSlots.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return start < bEnd && end > bStart;
      });

      if (isInactive) return;

      const isBlocked = blockedSlots.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return start < bEnd && end > bStart;
      });

      let status: "available" | "soldOut" | "past" = isBlocked
        ? "soldOut"
        : "available";

      if (start < new Date()) {
        status = "past";
      }

      slots.push({ start, end, status });
    });

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const daySlots = getAvailableSlotsForDate();
  const availableOnlySlots = daySlots.filter((s) => s.status === "available");

  const getSlotPricing = (slot: { start: Date; end: Date }) => {
    const override = slotOverrides.find(
      (o) => new Date(o.startTime).getTime() === slot.start.getTime(),
    );
    return {
      final: override?.calculatedPrice || 0,
      base: override?.basePrice || 0,
    };
  };

  const totalSlotPrice = selectedTimeSlots.reduce(
    (acc, slot) =>
      acc +
      (slot.price !== undefined ? slot.price : getSlotPricing(slot).final),
    0,
  );

  const totalBasePrice = selectedTimeSlots.reduce(
    (acc, slot) =>
      acc +
      (slot.basePrice !== undefined
        ? slot.basePrice
        : getSlotPricing(slot).base),
    0,
  );

  const totalDiscount = totalBasePrice - totalSlotPrice;

  const startingPrice =
    availableOnlySlots.length > 0
      ? Math.min(...availableOnlySlots.map((s) => getSlotPricing(s).final))
      : null;

  const toggleSlotSelection = (slot: {
    start: Date;
    end: Date;
    status?: string;
  }) => {
    if (slot.status === "soldOut" || slot.status === "past") return;
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
      const pricing = getSlotPricing(slot);
      setSelectedTimeSlots([
        ...selectedTimeSlots,
        {
          ...slot,
          price: pricing.final,
          basePrice: pricing.base,
        },
      ]);
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

  const generateQuote = async () => {
    if (selectedTimeSlots.length === 0) return;
    setLoadingQuote(true);
    handleNext();

    try {
      const res = await fetch("/api/v1/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: selectedStudio,
          timeSlots: selectedTimeSlots,
          addOns: selectedAddOns,
          promoCode: promoRule?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Promo code inactive") {
          setPromoStatus("invalid");
          setPromoError("Promo code inactive");
          setPromoRule(null);
          // Go back to step 2 to fix the booking or remove the code
          setStep(2);
        } else {
          alert(data.error || "Failed to generate quote.");
        }
        return;
      }
      setQuoteData(data);
    } catch (err) {
      console.error("Quote fetch err", err);
      alert("Something went wrong calculating the price.");
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleNextAvailableDate = () => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = val.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    setPhone(formatted);
    if (digits.length === 10) {
      setPhoneError("");
    }
  };

  const handleCompletePayment = async () => {
    if (!selectedStudio || !selectedLocation || selectedTimeSlots.length === 0)
      return;
    if (!fullName || !email || !phone) {
      alert("Please enter your name, email, and phone number.");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit US phone number.");
      return;
    }

    setIsRedirecting(true);
    try {
      const result = await createCheckoutSession({
        studioId: selectedStudio,
        locationId: selectedLocation,
        timeSlots: selectedTimeSlots.map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
        })),
        addOns: selectedAddOns,
        customerEmail: email,
        customerName: fullName,
        customerPhone: `+1${digits}`,
        // Marketing attribution
        promoCodeId: promoRule?.id,
        utmSource: utmParams.utm_source || undefined,
        utmMedium: utmParams.utm_medium || undefined,
        utmCampaign: utmParams.utm_campaign || undefined,
      });

      if (result.error) {
        alert(result.error);
        setIsRedirecting(false);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Payment error", err);
      setIsRedirecting(false);
    }
  };

  return (
    <div className={cn(Theme.classes.widgetWrapper, Theme.classes.widgetGlass)}>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between z-10 relative">
        <h2 className="text-2xl tracking-tight">
          {step === 1 && "Choose a Location"}
          {step === 2 &&
            (locations.find((l) => l.id === selectedLocation)?.name ||
              "Select Sessions")}
          {step === 3 && "Service Enhancements"}
          {step === 4 && "Final Details & Quote"}
        </h2>
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="text-sm font-medium hover:opacity-70 transition-colors bg-white/20 dark:bg-brand-latte/10 px-3 py-1 rounded-full"
            >
              Back
            </button>
          )}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-brand-latte" />
              ) : (
                <Moon className="w-5 h-5 text-brand-black" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: LOCATIONS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {loadingLocs ? (
                <div className="animate-pulse space-y-4 py-1">
                  <div className="h-20 bg-neutral-200/50 dark:bg-brand-latte/5 rounded-xl"></div>
                </div>
              ) : !Array.isArray(locations) || locations.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  No locations available at the moment.
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
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="flex bg-white/40 dark:bg-brand-latte/5 p-1 rounded-2xl overflow-x-auto hide-scrollbar whitespace-nowrap shadow-inner border border-white/20 dark:border-white/5">
                {studios
                  .filter((studio) => {
                    if (!selectedDate) return true;
                    const date = startOfDay(selectedDate);
                    const validFrom = studio.validFrom
                      ? startOfDay(new Date(studio.validFrom))
                      : null;
                    const validTo = studio.validTo
                      ? startOfDay(new Date(studio.validTo))
                      : null;

                    if (validFrom && date < validFrom) return false;
                    if (validTo && date > validTo) return false;
                    return true;
                  })
                  .map((studio) => (
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
                      <span className="flex items-center gap-2 justify-center w-full">
                        {studio.name}
                        {(studio as any).isSpecial}
                      </span>
                    </button>
                  ))}
              </div>

              <motion.div
                layout
                className="flex flex-col gap-3 sm:gap-6 bg-white/40 dark:bg-brand-latte/5 p-3 sm:p-5 rounded-2xl border border-white/20"
              >
                {/* Visual Calendar (Top) */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold relative">
                        {format(currentMonth, "MMMM yyyy")}
                      </h3>
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
                          onClick={() => !isSelected && setSelectedDate(day)}
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

                {/* Available Time Slots */}
                <motion.div
                  layout
                  className="w-full flex flex-col gap-3 mt-2 sm:mt-4 overflow-hidden min-h-[140px] sm:min-h-[230px]"
                >
                  <AnimatePresence mode="wait">
                    {!selectedDate ? (
                      <motion.div
                        key="no-date"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-[140px] sm:h-[230px] rounded-2xl border-[2px] border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center opacity-50 bg-brand-black/5 dark:bg-brand-latte/5"
                      >
                        <Clock className="w-8 h-8 opacity-30 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                          Select a date
                        </span>
                      </motion.div>
                    ) : daySlots.length === 0 && !loadingSlots ? (
                      <motion.div
                        key="empty"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-[140px] sm:h-[230px] rounded-2xl border-[2px] border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center bg-brand-black/5 dark:bg-brand-latte/5 p-6 text-center"
                      >
                        <CalendarIcon className="w-8 h-8 opacity-30 mb-3" />
                        <h4 className="font-bold mb-1">
                          No sessions available
                        </h4>
                        <p className="text-xs opacity-60 mb-4">
                          The studio is fully booked or closed on this date.
                        </p>
                        <button
                          onClick={handleNextAvailableDate}
                          className="text-xs bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-full"
                        >
                          Check Next Day
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="slots-container"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full relative flex flex-col min-h-[140px] sm:min-h-[230px]"
                      >
                        {/* <AnimatePresence>
                          {loadingSlots && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-[-8px] z-10 bg-brand-latte/40 dark:bg-brand-black/40 backdrop-blur-[2px] rounded-2xl pointer-events-none"
                            />

                          )}
                        </AnimatePresence> */}

                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
                          {daySlots.map((slot) => (
                            <SlotButton
                              key={slot.start.toISOString()}
                              slot={slot}
                              price={getSlotPricing(slot).final}
                              isSelected={selectedTimeSlots.some(
                                (s) =>
                                  s.start.getTime() === slot.start.getTime(),
                              )}
                              toggleSlotSelection={toggleSlotSelection}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 3: ADD-ONS */}
          {step === 3 && (
            <motion.div
              key="step-3"
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white/40 dark:bg-brand-latte/5 p-4 sm:p-6 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-4 opacity-70">
                  <p className="text-sm font-semibold uppercase tracking-wider">
                    Available Add-ons
                  </p>
                </div>

                {availableAddons.length === 0 ? (
                  <p className="text-sm opacity-60 italic">
                    No add-ons available for this studio.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {availableAddons.map((addon) => {
                      const isSelected = selectedAddOns.some(
                        (a) => a.id === addon.id,
                      );
                      return (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddOn(addon)}
                          className={cn(
                            "p-4 rounded-xl border flex items-center justify-between transition-all group",
                            isSelected
                              ? "border-black bg-white/60 dark:bg-white/10 dark:border-white shadow-md scale-[1.02]"
                              : "border-black/10 hover:border-black/30 dark:border-white/10 dark:hover:border-white/30 bg-white/20 dark:bg-brand-latte/5",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-all",
                                isSelected
                                  ? "bg-brand-blue text-white"
                                  : "bg-white/50 text-black/50 dark:bg-black/50 dark:text-white/50",
                              )}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                <Plus className="w-5 h-5" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm sm:text-base leading-tight">
                                {addon.name}
                              </p>
                              <p className="text-[11px] sm:text-xs opacity-60 mt-0.5">
                                Enhance your studio experience.
                              </p>
                            </div>
                          </div>
                          <p className="font-mono text-sm font-semibold bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full">
                            +${addon.price.toFixed(0)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: QUOTE & CHECKOUT */}
          {step === 4 && (
            <motion.div
              key="step-4"
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/20 dark:bg-brand-black/40 p-3 rounded-2xl border border-white/20 space-y-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Phone Number (US)"
                  className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                />
                {phoneError && (
                  <p className="text-xs text-red-500 font-medium px-2">
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="p-4 sm:p-6 bg-white/40 dark:bg-brand-latte/5 rounded-2xl border border-white/30 dark:border-white/10 shadow-lg">
                <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
                  Order Summary
                  <span className="text-xs font-normal opacity-70 bg-brand-black/10 dark:bg-brand-latte/10 px-2 py-1 rounded-full">
                    {selectedTimeSlots.length} Session
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
                    {/* Manual Promo Code Input */}
                    <div className="border-t border-black/5 dark:border-white/5 pt-3">
                      {promoStatus === "valid" ? (
                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-xs  text-green-600 dark:text-green-400 uppercase tracking-widest">
                              Code Applied ✓
                            </p>
                            <p className="text-sm font-bold">
                              {promoCode.toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={clearPromo}
                            className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
                            aria-label="Remove promo code"
                          >
                            <X className="w-4 h-4 opacity-60" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            id="promo-code-input"
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value);
                              if (promoStatus !== "idle") clearPromo();
                            }}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleApplyPromo()
                            }
                            placeholder="Enter promo code"
                            className="flex-1 p-2.5 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 placeholder:text-neutral-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all uppercase"
                          />
                          <button
                            id="apply-promo-btn"
                            onClick={handleApplyPromo}
                            disabled={
                              promoStatus === "loading" || !promoCode.trim()
                            }
                            className="px-3 py-2.5 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black font-bold text-sm rounded-xl disabled:opacity-50 transition-all hover:opacity-80"
                          >
                            {promoStatus === "loading" ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>
                      )}
                      {promoStatus === "invalid" && (
                        <p className="text-xs text-red-500 font-medium mt-2">
                          {promoError}
                        </p>
                      )}
                    </div>{" "}
                    {quoteData.bestDiscount > 0 && (
                      <div className="flex flex-col gap-1 border-t border-black/5 dark:border-white/5 pt-3">
                        <div className="flex justify-between items-center text-brand-blue dark:text-brand-jasmine font-bold hover:bg-brand-jasmine/10 p-3 rounded-xl">
                          <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {quoteData.appliedPromo?.name || "Discount Applied"}
                          </span>
                          <span>-${quoteData.bestDiscount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    <div className="border-t-2 border-black/20 dark:border-white/20 pt-4 mt-2 flex justify-between items-center  text-2xl">
                      <span>Total</span>
                      <span>${quoteData.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleCompletePayment}
                disabled={
                  loadingQuote || !quoteData || !fullName || isRedirecting
                }
                className={cn(
                  Theme.classes.secondaryButton,
                  isRedirecting && "opacity-50 cursor-not-allowed",
                )}
              >
                {isRedirecting
                  ? "Redirecting to Stripe..."
                  : "Complete Payment"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Redesigned Bottom Cart Bar */}
      <AnimatePresence>
        {(step === 2 || step === 3) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="mt-6 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 sm:p-8 rounded-b-[3rem] flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex flex-col">
              <span className="text-[10px]  uppercase tracking-[0.2em] opacity-50">
                Reservation Subtotal
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl ">
                  $
                  {(
                    totalSlotPrice +
                    selectedAddOns.reduce((acc, a) => acc + a.price, 0)
                  ).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                  USD
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {totalDiscount > 0 && (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                    Saved ${totalDiscount.toFixed(2)}
                  </span>
                )}
                {selectedTimeSlots.length > 0 && (
                  <span className="text-[10px] font-bold bg-white/10 dark:bg-black/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {selectedTimeSlots.length} slot
                    {selectedTimeSlots.length > 1 ? "s" : ""}
                  </span>
                )}
                {selectedAddOns.length > 0 && (
                  <span className="text-[10px] font-bold bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded-full uppercase tracking-widest">
                    +{selectedAddOns.length} add-on
                    {selectedAddOns.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={step === 2 ? handleNext : generateQuote}
              disabled={selectedTimeSlots.length === 0}
              className="px-8 py-4 bg-white dark:bg-brand-black text-brand-black dark:text-brand-latte rounded-2xl shadow-xl hover:bg-brand-jasmine hover:text-brand-black active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-brand-black disabled:hover:text-brand-black dark:disabled:hover:text-brand-latte"
            >
              {step === 2 ? "Confirm Slots" : "Review Quote"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotButton({
  slot,
  price,
  isSelected,
  toggleSlotSelection,
}: {
  slot: any;
  price: number;
  isSelected: boolean;
  toggleSlotSelection: (s: any) => void;
}) {
  const isSoldOut = slot.status === "soldOut";
  const isPast = slot.status === "past";
  const isDisabled = isSoldOut || isPast;

  return (
    <button
      onClick={() => toggleSlotSelection(slot)}
      disabled={isDisabled}
      className={cn(
        "flex flex-col items-center justify-center py-2 sm:py-3 px-1 rounded-xl transition-all duration-300 font-bold border w-full",
        isDisabled &&
          "opacity-40 bg-black/5 dark:bg-white/5 border-transparent cursor-not-allowed",
        !isSelected &&
          !isDisabled &&
          "hover:bg-brand-black/5 dark:hover:bg-white/5 bg-white/70 dark:bg-brand-latte/10 border-black/10 dark:border-white/10 shadow-sm active:scale-[0.98]",
        isSelected &&
          "bg-brand-blue text-brand-latte shadow-lg border-brand-blue scale-[1.02]",
      )}
    >
      <span
        className={cn(
          "text-sm sm:text-[15px] leading-none mb-1",
          isSelected ? "text-brand-latte" : "",
        )}
      >
        {format(slot.start, "h:mm a")}
      </span>
      <span
        className={cn(
          "text-[9px] sm:text-[10px] uppercase font-bold tracking-wider",
          isSoldOut || isPast
            ? "text-red-500"
            : isSelected
              ? "text-brand-latte/90"
              : "text-brand-blue/70 dark:text-brand-jasmine",
        )}
      >
        {isSoldOut ? "Sold Out" : isPast ? "Expired" : `$${price.toFixed(0)}`}
      </span>
    </button>
  );
}
