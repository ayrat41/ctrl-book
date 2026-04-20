"use client";

import { useState } from "react";
import { Plus, X, Box, Sliders } from "lucide-react";
import { createStudio } from "@/app/admin/studios/actions";

interface NewStudioModalProps {
  locationId: string;
}

export default function NewStudioModal({ locationId }: NewStudioModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStudio(formData);
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
        className="px-4 py-2 bg-brand-blue text-brand-latte hover:bg-brand-jasmine hover:text-brand-black active:scale-95 transition-all rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Studio
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-xl rounded-[3rem] border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center text-neutral-900 dark:text-brand-latte">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Sliders className="w-7 h-7" />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight">Define Style</h2>
                   <p className="text-xs font-bold opacity-30 uppercase tracking-widest">Room Archetype Registry</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 opacity-20 hover:opacity-100" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 text-neutral-900 dark:text-brand-latte overflow-y-auto max-h-[70vh] hide-scrollbar">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Style Name</label>
                    <input name="name" required placeholder="e.g. Minimalist White" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Archetype</label>
                    <select name="type" required className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold appearance-none">
                      <option value="White">White</option>
                      <option value="Black">Black</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Description</label>
                  <textarea name="description" rows={3} placeholder="Describe the aesthetics, vibe, and unique features of this room style..." className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm leading-relaxed" />
               </div>

               <div className="grid grid-cols-2 gap-6 pt-6 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Capacity</label>
                    <input name="maxCapacity" type="number" defaultValue={6} required className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Default Room ID (Optional)</label>
                  <input name="roomId" placeholder="e.g. ROOM_A" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold uppercase" />
                  <p className="text-[10px] opacity-30 font-bold uppercase px-1">Linking studios by Room ID shares their physical availability.</p>
               </div>

               <input type="hidden" name="locationId" value={locationId} />
               <input type="hidden" name="sessionDuration" value={60} />

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 mt-6 bg-brand-blue text-brand-latte font-black rounded-[1.5rem] shadow-2xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-widest"
               >
                  {isSubmitting ? "COMMITING..." : "Register Studio"}
               </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
