"use client";

import { useState } from "react";
import { Plus, X, Box, Zap, Trash2, Layout, Sliders } from "lucide-react";
import { createStudio, deleteStudio } from "@/app/admin/studios/actions";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/theme.config";

interface StudioRegistryProps {
  locations: { id: string; name: string }[];
  studios: any[];
}

export default function StudioRegistry({ locations, studios }: StudioRegistryProps) {
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
      e.currentTarget.reset();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-brand-blue" /> Studio Styles
          </h2>
          <p className="text-sm opacity-50 font-medium uppercase tracking-widest">Define your room archetypes and styles</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 bg-brand-black dark:bg-brand-latte dark:text-brand-black text-brand-latte font-bold rounded-xl shadow-xl active:scale-95 transition-all text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Studio Style
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios.length === 0 && (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2.5rem] opacity-30 font-medium italic">
            No styles defined in the catalog.
          </div>
        )}
        
        {studios.map(studio => (
          <div key={studio.id} className="p-6 bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-[2.5rem] shadow-sm flex flex-col justify-between group hover:border-brand-blue/30 transition-all">
            <div>
               <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                    studio.type === "White" ? "bg-zinc-100 text-zinc-900" : 
                    studio.type === "Black" ? "bg-zinc-900 text-brand-latte" : "bg-brand-blue text-brand-latte"
                  )}>
                     <Box className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => deleteStudio(studio.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <h3 className="font-black text-xl tracking-tight leading-none">{studio.name}</h3>
                     <span className="text-[9px] px-1.5 py-0.5 bg-brand-black/5 dark:bg-brand-latte/10 rounded font-black uppercase tracking-tighter opacity-60">
                        {studio.type}
                     </span>
                  </div>
                  <p className="text-sm opacity-50 font-medium line-clamp-3 leading-relaxed">
                     {studio.description || "No description provided for this studio style."}
                  </p>
               </div>
            </div>

            <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Pricing Model</span>
                  <span className="font-mono font-bold text-brand-blue dark:text-brand-jasmine text-xs">DYNAMIC RATE governed.</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Capacity</span>
                  <span className="font-bold">{studio.maxCapacity} Seats</span>
               </div>
            </div>
          </div>
        ))}
      </div>

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

               <div className="pt-6 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-2 max-w-[50%]">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Capacity</label>
                    <input name="maxCapacity" type="number" defaultValue={6} required className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Default Room ID (Optional)</label>
                  <input name="roomId" placeholder="e.g. ROOM_A" className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold uppercase" />
                  <p className="text-[10px] opacity-30 font-bold uppercase px-1">Linking studios by Room ID shares their physical availability.</p>
               </div>

               {/* Location is still technically required by DB, but we hide it or default it to first location */}
               <input type="hidden" name="locationId" value={locations[0]?.id || ""} />
               <input type="hidden" name="sessionDuration" value={60} />

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 mt-6 bg-brand-blue text-brand-latte font-black rounded-[1.5rem] shadow-2xl shadow-brand-blue/30 hover:bg-brand-jasmine active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-widest"
               >
                  {isSubmitting ? "COMMITING..." : "Register Style"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
