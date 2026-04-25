"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  X, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Tag, 
  DollarSign, 
  Trash2, 
  RefreshCcw,
  CheckCircle2,
  Clock,
  Ban
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { cancelBooking, refundBooking, updateBookingStatus } from "./booking-actions";

type Booking = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  finalPrice: number;
  addOns: string[];
  groupId: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  stripePaymentId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  customer: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  studio: {
    name: string;
    location: {
      name: string;
    };
  };
};

export default function BookingsClient({ initialBookings }: { initialBookings: any[] }) {
  const [bookings, setBookings] = useState<Booking[]>(
    initialBookings.map(b => ({
      ...b,
      startTime: new Date(b.startTime),
      endTime: new Date(b.endTime),
      cancelledAt: b.cancelledAt ? new Date(b.cancelledAt) : null,
    }))
  );
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCancel = async (id: string) => {
    const reason = window.prompt("Reason for cancellation?");
    if (reason === null) return;
    
    setIsProcessing(true);
    const res = await cancelBooking(id, reason);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } : b));
      if (selectedBooking?.id === id) setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
    setIsProcessing(false);
  };

  const handleRefund = async (id: string) => {
    if (!window.confirm("Are you sure you want to trigger a Stripe refund? This cannot be undone.")) return;
    
    setIsProcessing(true);
    const res = await refundBooking(id);
    if (res.success) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'refunded' } : b));
      if (selectedBooking?.id === id) setSelectedBooking(prev => prev ? { ...prev, status: 'refunded' } : null);
    } else {
      alert(res.error);
    }
    setIsProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "pending": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "cancelled": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "refunded": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default: return "bg-neutral-500/10 text-neutral-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case "pending": return <Clock className="w-3 h-3 mr-1" />;
      case "cancelled": return <Ban className="w-3 h-3 mr-1" />;
      case "refunded": return <RefreshCcw className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-brand-latte/5 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-brand-latte/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          {["all", "confirmed", "pending", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                statusFilter === status 
                  ? "bg-brand-black text-white dark:bg-brand-latte dark:text-brand-black shadow-md" 
                  : "opacity-40 hover:opacity-100"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-brand-latte/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] opacity-50">Customer</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] opacity-50">Session Details</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] opacity-50">Status</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] opacity-50 text-right">Revenue</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center opacity-30 font-bold text-lg italic">
                    No reservations matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-400">
                          {b.customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-base">{b.customer.fullName}</div>
                          <div className="text-xs opacity-50 font-medium">{b.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{b.studio.name}</span>
                          <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded uppercase font-black opacity-50">
                            {b.studio.location.name}
                          </span>
                        </div>
                        <div className="text-xs font-medium opacity-60">
                          {format(b.startTime, "EEE, MMM d")} • {format(b.startTime, "h:mm a")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        getStatusColor(b.status)
                      )}>
                        {getStatusIcon(b.status)}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-base">
                      ${b.finalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-5 h-5 opacity-40" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Slide-over / Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto border-l border-white/10"
            >
              <div className="p-8 space-y-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Reservation ID</p>
                    <h2 className="text-xl font-mono font-bold opacity-70">{selectedBooking.id}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Status Card */}
                <div className={cn(
                  "p-6 rounded-3xl border flex items-center justify-between shadow-sm",
                  getStatusColor(selectedBooking.status),
                  "border-current/20"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-current/10 flex items-center justify-center">
                      {getStatusIcon(selectedBooking.status)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                      <p className="text-2xl font-black capitalize">{selectedBooking.status}</p>
                    </div>
                  </div>
                  {selectedBooking.cancelledAt && (
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Cancelled On</p>
                      <p className="font-bold">{format(selectedBooking.cancelledAt, "MMM d, h:mm a")}</p>
                    </div>
                  )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                      <User className="w-3 h-3" /> Customer Info
                    </h3>
                    <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl space-y-3">
                      <div>
                        <p className="text-[10px] font-bold opacity-40">Full Name</p>
                        <p className="font-bold text-lg">{selectedBooking.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold opacity-40">Email Address</p>
                        <p className="font-bold">{selectedBooking.customer.email}</p>
                      </div>
                      {selectedBooking.customer.phone && (
                        <div>
                          <p className="text-[10px] font-bold opacity-40">Phone Number</p>
                          <p className="font-bold">{selectedBooking.customer.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                      <Calendar className="w-3 h-3" /> Reservation
                    </h3>
                    <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl space-y-3">
                      <div>
                        <p className="text-[10px] font-bold opacity-40">Studio / Room</p>
                        <p className="font-bold text-lg">{selectedBooking.studio.name}</p>
                        <p className="text-xs opacity-60">{selectedBooking.studio.location.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold opacity-40">Date & Time</p>
                        <p className="font-bold">{format(selectedBooking.startTime, "EEEE, MMMM d, yyyy")}</p>
                        <p className="text-sm opacity-60">
                          {format(selectedBooking.startTime, "h:mm a")} - {format(selectedBooking.endTime, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                      <DollarSign className="w-3 h-3" /> Financials
                    </h3>
                    <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl space-y-3 border-l-4 border-green-500">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold opacity-40">Total Paid</p>
                        <p className="text-2xl font-black">${selectedBooking.finalPrice.toFixed(2)}</p>
                      </div>
                      {selectedBooking.stripePaymentId && (
                        <div>
                          <p className="text-[10px] font-bold opacity-40">Stripe Payment ID</p>
                          <p className="text-xs font-mono opacity-60 truncate">{selectedBooking.stripePaymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marketing Attribution */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-40">
                      <Tag className="w-3 h-3" /> Attribution
                    </h3>
                    <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] font-bold opacity-40">Source</p>
                          <p className="text-xs font-bold truncate">{selectedBooking.utmSource || 'direct'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold opacity-40">Medium</p>
                          <p className="text-xs font-bold truncate">{selectedBooking.utmMedium || 'none'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold opacity-40">Campaign</p>
                          <p className="text-xs font-bold truncate">{selectedBooking.utmCampaign || 'none'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-ons List */}
                {selectedBooking.addOns.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Active Add-ons</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.addOns.map(addon => (
                        <span key={addon} className="px-3 py-1.5 bg-brand-black/5 dark:bg-white/10 rounded-full text-xs font-bold">
                          + {addon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancellation Logic */}
                {selectedBooking.cancellationReason && (
                   <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Cancellation Detail</p>
                      <p className="font-medium italic opacity-80">&ldquo;{selectedBooking.cancellationReason}&rdquo;</p>
                   </div>
                )}

                {/* Footer Actions */}
                <div className="pt-10 flex flex-col sm:flex-row gap-3 border-t border-black/5 dark:border-white/10">
                  {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'refunded' && (
                    <button 
                      onClick={() => handleCancel(selectedBooking.id)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-lg disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" /> Cancel Booking
                    </button>
                  )}
                  
                  {selectedBooking.stripePaymentId && selectedBooking.status !== 'refunded' && (
                    <button 
                      onClick={() => handleRefund(selectedBooking.id)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-purple-500/50 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-purple-500/10 transition-all disabled:opacity-50"
                    >
                      <RefreshCcw className="w-4 h-4" /> Issue Refund
                    </button>
                  )}

                  {selectedBooking.status === 'pending' && (
                     <button 
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-all shadow-lg disabled:opacity-50"
                     >
                        <CheckCircle2 className="w-4 h-4" /> Mark Confirmed
                     </button>
                  )}
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] font-bold opacity-30">
                    Modifying this reservation will trigger system notification updates.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
