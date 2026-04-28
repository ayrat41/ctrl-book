"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Ban, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  User,
  History,
  AlertCircle,
  CalendarPlus,
  Trash2,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";
import { updateCustomer, deleteCustomer } from "./customer-actions";
import { motion, AnimatePresence } from "framer-motion";

type CustomerWithStats = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  socialHandle: string | null;
  isBlacklisted: boolean;
  notes: string | null;
  createdAt: Date;
  totalRevenue: number;
  bookingCount: number;
  lastBooking: Date | null;
};

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: CustomerWithStats[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof CustomerWithStats>("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter and Sort Logic
  const filteredCustomers = useMemo(() => {
    let result = customers.filter((c) => {
      const search = searchTerm.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.phone && c.phone.includes(search))
      );
    });

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null) return 1;
      if (valB === null) return -1;

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, searchTerm, sortKey, sortOrder]);

  const handleToggleBlacklist = async (customer: CustomerWithStats) => {
    setIsProcessing(true);
    const newStatus = !customer.isBlacklisted;
    const result = await updateCustomer(customer.id, { isBlacklisted: newStatus });
    
    if (result.success) {
      setCustomers(prev => 
        prev.map(c => c.id === customer.id ? { ...c, isBlacklisted: newStatus } : c)
      );
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer({ ...selectedCustomer, isBlacklisted: newStatus });
      }
    }
    setIsProcessing(false);
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    const result = await updateCustomer(id, { notes });
    if (result.success) {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    setIsProcessing(true);
    const result = await deleteCustomer(id);
    if (result.success) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSelectedCustomer(null);
    }
    setIsProcessing(false);
  };

  const toggleSort = (key: keyof CustomerWithStats) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/5">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/5 transition-all text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-[10px] uppercase tracking-widest font-bold opacity-40">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-brand-blue transition-colors" onClick={() => toggleSort("fullName")}>
                    <div className="flex items-center gap-1">
                      Customer {sortKey === "fullName" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-brand-blue transition-colors" onClick={() => toggleSort("bookingCount")}>
                    <div className="flex items-center gap-1">
                      Stats {sortKey === "bookingCount" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-brand-blue transition-colors" onClick={() => toggleSort("totalRevenue")}>
                    <div className="flex items-center gap-1">
                      LTV {sortKey === "totalRevenue" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      selectedCustomer?.id === customer.id ? "bg-brand-blue/5 dark:bg-brand-blue/10" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-inner",
                          customer.isBlacklisted ? "bg-red-500/10 text-red-500" : "bg-gradient-to-tr from-brand-jasmine/20 to-brand-blue/20 text-brand-blue"
                        )}>
                          {customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {customer.fullName}
                            {customer.isBlacklisted && <Ban className="w-3 h-3 text-red-500" />}
                          </div>
                          <div className="text-xs opacity-50 flex flex-col">
                            <span>{customer.email}</span>
                            {customer.phone && <span className="font-mono">{customer.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{customer.bookingCount} Bookings</span>
                        <span className="text-[10px] opacity-40 uppercase">
                          Last: {customer.lastBooking ? format(new Date(customer.lastBooking), "MMM d, yyyy") : "Never"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-brand-blue dark:text-brand-jasmine">
                        ${customer.totalRevenue.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCustomers.length === 0 && (
              <div className="py-20 text-center opacity-30 italic">
                No customers found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Details View */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(Theme.classes.cardGlass, "p-6 sticky top-24 space-y-8")}
              >
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className={cn(
                    "w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold shadow-2xl relative",
                    selectedCustomer.isBlacklisted ? "bg-red-500/10 text-red-500" : "bg-gradient-to-tr from-brand-jasmine/20 to-brand-blue/20 text-brand-blue"
                  )}>
                    {selectedCustomer.fullName.charAt(0)}
                    {selectedCustomer.isBlacklisted && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full border-4 border-white dark:border-neutral-900">
                        <Ban className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCustomer.fullName}</h2>
                    <p className="text-sm opacity-50">Customer since {format(new Date(selectedCustomer.createdAt), "MMMM yyyy")}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => window.location.href = `/admin/schedule-management?customer=${selectedCustomer.id}`}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Book Slot</span>
                  </button>
                  <button 
                    onClick={() => handleToggleBlacklist(selectedCustomer)}
                    disabled={isProcessing}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95",
                      selectedCustomer.isBlacklisted 
                        ? "border-green-500/50 bg-green-500/5 text-green-600 dark:text-green-400" 
                        : "border-red-500/50 bg-red-500/5 text-red-600 dark:text-red-400"
                    )}
                  >
                    <Ban className="w-5 h-5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      {selectedCustomer.isBlacklisted ? "Unblacklist" : "Blacklist"}
                    </span>
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <Mail className="w-4 h-4 opacity-40" />
                    <span className="text-sm font-medium">{selectedCustomer.email}</span>
                   </div>
                   <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <Phone className="w-4 h-4 opacity-40" />
                    <span className="text-sm font-medium font-mono">{selectedCustomer.phone || "No phone provided"}</span>
                   </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-40 px-1">Admin Notes</label>
                  <textarea 
                    className="w-full p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all text-sm min-h-[120px] resize-none"
                    placeholder="Add internal notes about this customer..."
                    defaultValue={selectedCustomer.notes || ""}
                    onBlur={(e) => handleUpdateNotes(selectedCustomer.id, e.target.value)}
                  />
                </div>

                {/* DANGER ZONE */}
                <div className="pt-4 border-t border-black/5 dark:border-white/5">
                  <button 
                    onClick={() => handleDelete(selectedCustomer.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Profile
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center p-8 text-center opacity-30 space-y-4 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                <User className="w-12 h-12" />
                <p>Select a customer from the list to view details and manage their profile.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
