"use client";

import { useState } from "react";
import { Plus, X, Box, Sliders } from "lucide-react";
import { createStudio } from "@/app/admin/studio-actions";

interface NewStudioModalProps {
  locationId: string;
}

export default function NewStudioModal({ locationId }: NewStudioModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStudio(formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      setIsSpecial(false);
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
                  <h2 className="text-2xl font-black tracking-tight">
                    Define Style
                  </h2>
                  <p className="text-xs font-bold opacity-30 uppercase tracking-widest">
                    Room Archetype Registry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-brand-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 opacity-20 hover:opacity-100" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-10 space-y-6 text-neutral-900 dark:text-brand-latte overflow-y-auto max-h-[70vh] hide-scrollbar"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Style Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Minimalist White"
                    className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Physical Room
                  </label>
                  <select
                    name="roomId"
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold appearance-none"
                  >
                    <option value="ROOM_WHITE">White Room</option>
                    <option value="ROOM_BLACK">Black Room</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-brand-black/5 dark:bg-brand-latte/5 p-6 rounded-3xl">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSpecial"
                    name="isSpecial"
                    value="true"
                    checked={isSpecial}
                    onChange={(e) => setIsSpecial(e.target.checked)}
                    className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue"
                  />
                  <label
                    htmlFor="isSpecial"
                    className="text-sm font-bold cursor-pointer"
                  >
                    This is a Special Backdrop
                  </label>
                </div>

                {isSpecial && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                        Available From
                      </label>
                      <input
                        type="date"
                        name="validFrom"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                        Available To
                      </label>
                      <input
                        type="date"
                        name="validTo"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe the aesthetics, vibe, and unique features of this room style..."
                  className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-medium text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-black/5 dark:border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Base Price Premium
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="baseAdjustmentValue"
                      type="number"
                      step="any"
                      defaultValue={0}
                      className="flex-1 px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold"
                    />
                    <select
                      name="baseAdjustmentType"
                      className="w-24 px-4 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-xs appearance-none"
                    >
                      <option value="fixed_amount">$</option>
                      <option value="percentage">%</option>
                      <option value="fixed_override">Set</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Capacity
                  </label>
                  <input
                    name="maxCapacity"
                    type="number"
                    defaultValue={6}
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold"
                  />
                </div>
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
