"use client";

import { useState } from "react";
import { Edit2, X, Settings2 } from "lucide-react";
import { updateStudioConfig } from "@/app/admin/studio-actions";

interface Studio {
  id: string;
  name: string;
  type: string | null;
  roomId: string | null;
  sessionDuration: number;
  maxCapacity: number;
}

export default function EditStudioModal({ studio }: { studio: Studio }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateStudioConfig(studio.id, formData);
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
        className="text-xs font-bold text-neutral-500 hover:text-brand-blue transition-colors flex items-center gap-1"
      >
        <Edit2 className="w-3 h-3" /> Edit Configuration
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] w-full max-w-lg rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center text-neutral-900 dark:text-brand-latte">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Settings2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Studio Setup</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans text-neutral-900 dark:text-brand-latte overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Display Name</label>
                  <input name="name" defaultValue={studio.name} required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-blue-500/50 outline-none transition-all font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Studio Type</label>
                  <select name="type" defaultValue={studio.type || ""} className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-blue-500/50 outline-none transition-all font-semibold appearance-none">
                    <option value="">Generic</option>
                    <option value="White">White</option>
                    <option value="Black">Black</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Physical Room Group (Room ID)</label>
                <input name="roomId" defaultValue={studio.roomId || ""} placeholder="e.g. ROOM_B" className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-blue-500/50 outline-none transition-all font-mono font-bold uppercase" />
                <p className="text-[10px] opacity-40 font-medium px-1 uppercase tracking-tight">Studios with the same Room ID will block each other when booked.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Slot Length (min)</label>
                  <input name="sessionDuration" type="number" defaultValue={studio.sessionDuration} required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-blue-500/50 outline-none transition-all font-mono font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1 text-black dark:text-brand-latte">Max Capacity</label>
                <input name="maxCapacity" type="number" defaultValue={studio.maxCapacity} required className="w-full px-4 py-3 rounded-xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-blue-500/50 outline-none transition-all font-mono font-bold" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-4 bg-brand-black dark:bg-brand-latte dark:text-brand-black text-brand-latte font-black rounded-2xl shadow-xl hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "SAVING CONFIG..." : "UPDATE STUDIO"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
