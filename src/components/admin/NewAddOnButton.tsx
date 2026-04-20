"use client";

import { useState } from "react";
import { Plus, X, Package } from "lucide-react";
import { createAddOn } from "@/app/admin/addon-actions";

export default function NewAddOnButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAddOn(formData);
    setIsSubmitting(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand-blue hover:bg-brand-jasmine text-brand-latte font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-95 text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> New Add-on
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-brand-jasmine flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">New Add-on</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Service Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Photo Print Pack"
                  className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">Price ($)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  placeholder="25.00"
                  className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-brand-black/5 dark:bg-brand-latte/5 rounded-2xl border border-transparent hover:border-brand-blue/20 transition-all group">
                <div className="flex-1">
                   <div className="text-sm font-bold">Instantly Publish</div>
                   <div className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Make visible in widget</div>
                </div>
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked
                  className="w-6 h-6 rounded-lg accent-brand-blue cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-4 bg-brand-blue text-brand-latte font-black rounded-2xl shadow-xl shadow-brand-blue/20 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "PUBLISHING..." : "CREATE SERVICE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
