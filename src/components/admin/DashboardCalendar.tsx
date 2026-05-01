"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, subDays, setHours, setMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";
type MonthMetric = "booked" | "free";

export default function DashboardCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthMetric, setMonthMetric] = useState<MonthMetric>("booked");
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const fetchCalendarData = async () => {
    setLoading(true);
    let start, end;
    if (viewMode === "month") {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (viewMode === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      start = startOfDay(currentDate);
      end = setHours(setMinutes(startOfDay(currentDate), 59), 23);
    }

    try {
      const res = await fetch(`/api/v1/admin/calendar?start=${start.toISOString()}&end=${end.toISOString()}&locationId=${selectedLocation}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setStudios(data.studios || []);
      setLocations(data.locations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode, selectedLocation]);

  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const renderMonthView = () => {
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const startingDayIndex = getDay(startOfMonth(currentDate));

    // Calculate capacity per day
    const availableHoursPerDay = 12; // 9AM to 9PM approx
    const activeStudiosCount = selectedLocation === "all" ? studios.length : studios.filter(s => s.locationId === selectedLocation).length;
    const maxCapacityPerDay = activeStudiosCount * availableHoursPerDay;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-brand-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setMonthMetric("booked")}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", monthMetric === "booked" ? "bg-white dark:bg-brand-black shadow-sm" : "opacity-50")}
            >
              Slots Booked
            </button>
            <button
              onClick={() => setMonthMetric("free")}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", monthMetric === "free" ? "bg-white dark:bg-brand-black shadow-sm" : "opacity-50")}
            >
              Free / % Reserved
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold opacity-60 mb-2 uppercase tracking-widest">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
          {daysInMonth.map(day => {
            const dayBookings = bookings.filter(b => isSameDay(new Date(b.startTime), day));
            const bookedCount = dayBookings.length;
            const freeCount = Math.max(0, maxCapacityPerDay - bookedCount);
            const utilization = maxCapacityPerDay > 0 ? (bookedCount / maxCapacityPerDay) : 0;
            
            // Darker = busier
            const bgOpacity = Math.max(0.05, Math.min(0.9, utilization));

            return (
              <div
                key={day.toISOString()}
                className="aspect-square rounded-2xl border border-black/5 dark:border-white/5 p-3 flex flex-col relative overflow-hidden group"
              >
                <div 
                  className="absolute inset-0 bg-brand-blue dark:bg-brand-jasmine pointer-events-none transition-opacity duration-500" 
                  style={{ opacity: bgOpacity }} 
                />
                <div className="relative z-10 flex flex-col h-full">
                  <span className={cn("text-sm font-bold", utilization > 0.5 ? "text-white dark:text-black" : "")}>
                    {format(day, "d")}
                  </span>
                  
                  <div className="mt-auto">
                    {monthMetric === "booked" ? (
                      <span className={cn("text-xs font-semibold", utilization > 0.5 ? "text-white/90 dark:text-black/90" : "opacity-70")}>
                        {bookedCount} booked
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-semibold", utilization > 0.5 ? "text-white/90 dark:text-black/90" : "opacity-70")}>
                          {freeCount} free
                        </span>
                        <span className={cn("text-[10px] font-bold uppercase", utilization > 0.5 ? "text-white/80 dark:text-black/80" : "text-brand-blue/60 dark:text-brand-jasmine/60")}>
                          {Math.round(utilization * 100)}% res.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekOrDayView = () => {
    const days = viewMode === "week" 
      ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) })
      : [currentDate];
    
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const handleCreatePromo = (day: Date, hour: number) => {
      alert(`Creating promo for ${format(day, "MMM d")} at ${hour}:00`);
      // Redirect or open modal to promo creation
    };

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
            {/* Header Row */}
            <div className="p-2"></div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-4 text-center border-b border-black/5 dark:border-white/5">
                <div className="text-xs font-bold uppercase tracking-widest opacity-60">{format(day, "EEE")}</div>
                <div className="text-xl font-bold">{format(day, "d")}</div>
              </div>
            ))}

            {/* Time Rows */}
            {hours.map(hour => (
              <div key={`h-${hour}`} className="contents">
                <div className="p-2 text-[10px] font-bold opacity-40 text-right uppercase pt-4 border-r border-black/5 dark:border-white/5">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                {days.map(day => {
                  const cellStart = setHours(startOfDay(day), hour);
                  const slotBookings = bookings.filter(b => isSameDay(new Date(b.startTime), day) && new Date(b.startTime).getHours() === hour);
                  
                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="p-2 border-b border-r border-black/5 dark:border-white/5 min-h-[100px] flex flex-col gap-2">
                      {slotBookings.map(b => (
                        <div key={b.id} className="bg-brand-blue text-white dark:bg-brand-jasmine dark:text-black p-2 rounded-lg text-xs flex flex-col shadow-sm">
                          <span className="font-bold truncate">{b.customer?.fullName || 'Unknown'}</span>
                          <span className="text-[10px] opacity-80 truncate">{b.studio?.name}</span>
                        </div>
                      ))}
                      
                      {slotBookings.length === 0 && day >= startOfDay(new Date()) && (
                        <button 
                          onClick={() => handleCreatePromo(day, hour)}
                          className="mt-auto w-full py-2 border border-dashed border-black/10 dark:border-white/10 rounded-lg text-[10px] font-bold text-brand-blue dark:text-brand-jasmine hover:bg-brand-blue/5 dark:hover:bg-brand-jasmine/5 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100"
                        >
                          <Tag className="w-3 h-3" /> Offer Promo
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col font-['Space_Grotesk']">
      {/* Calendar Header */}
      <div className="p-6 border-b border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-black/5 dark:bg-white/5 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 opacity-70" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Operations Calendar</h3>
            <p className="text-xs font-semibold opacity-60 uppercase tracking-widest">
              {format(currentDate, "MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Location Filter */}
          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="h-10 px-4 rounded-xl bg-black/5 dark:bg-white/5 border-none outline-none text-sm font-bold appearance-none cursor-pointer"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          {/* View Toggles */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            {(["month", "week", "day"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all",
                  viewMode === mode ? "bg-white dark:bg-[#222] shadow-sm" : "opacity-50 hover:opacity-100"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Nav */}
          <div className="flex gap-1">
            <button onClick={handlePrev} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNext} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className={cn("p-6 relative transition-opacity duration-300", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {viewMode === "month" ? renderMonthView() : renderWeekOrDayView()}
      </div>
    </div>
  );
}
