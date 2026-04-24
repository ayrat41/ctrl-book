"use client";

import { useState } from "react";
import { updateStudioConfig, deleteStudio } from "@/app/admin/studio-actions";
import { Save, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { cn } from "@/lib/utils";

export default function StudioSettingsRow({ studio }: { studio: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [localIsSpecial, setLocalIsSpecial] = useState(studio.isSpecial);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateStudioConfig(studio.id, formData);
    setIsSubmitting(false);
    if (result.success) {
      setMessage({ type: "success", text: "Studio updated!" });
      setTimeout(() => {
        setMessage(null);
        setIsOpen(false);
      }, 1500);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update" });
    }
  };

  const handleDelete = async () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    const result = await deleteStudio(studio.id);
    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Failed to delete" });
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="bg-white dark:bg-brand-latte/[0.02] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden transition-all">
      <div
        className="p-5 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <div className="font-bold text-lg flex items-center gap-3">
            {studio.name}
            {studio.isSpecial && (
              <span className="text-[10px] px-2 py-1 bg-brand-yellow/10 text-brand-yellow rounded uppercase font-black">
                SPECIAL
              </span>
            )}
          </div>
          <div className="text-sm opacity-60 mt-1 font-medium flex gap-4">
            <span>Capacity: {studio.maxCapacity}</span>
            <span>Duration: {studio.sessionDuration}m</span>
            {studio.roomId && (
              <span>Room: {studio.roomId.replace("ROOM_", "")}</span>
            )}
            {studio.baseAdjustmentValue !== 0 && (
              <span className="text-brand-yellow font-black">
                Premium: {studio.baseAdjustmentType === 'percentage' ? `${studio.baseAdjustmentValue > 0 ? '+' : ''}${studio.baseAdjustmentValue}%` : `${studio.baseAdjustmentValue > 0 ? '+' : ''}$${studio.baseAdjustmentValue}`}
              </span>
            )}
            {studio.validFrom && (
              <span className="text-brand-blue font-black">
                {new Date(studio.validFrom).toLocaleDateString()} -{" "}
                {new Date(studio.validTo).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-lg transition-all",
              showConfirmDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-500/10 text-red-500 hover:bg-red-500/20",
            )}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 opacity-50" />
          ) : (
            <ChevronDown className="w-5 h-5 opacity-50" />
          )}
        </div>
      </div>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-6 border-t border-black/10 dark:border-white/10 space-y-4 bg-black/5 dark:bg-white/5"
        >
          {message && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm font-bold",
                message.type === "success"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600",
              )}
            >
              {message.text}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                Display Name
              </label>
              <input
                name="name"
                defaultValue={studio.name}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                Physical Room
              </label>
              <select
                name="roomId"
                defaultValue={studio.roomId || "ROOM_WHITE"}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none"
              >
                <option value="ROOM_WHITE">White Room</option>
                <option value="ROOM_BLACK">Black Room</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4 bg-white dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id={`isSpecial-${studio.id}`}
                name="isSpecial"
                value="true"
                checked={localIsSpecial}
                onChange={(e) => setLocalIsSpecial(e.target.checked)}
                className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue"
              />
              <label
                htmlFor={`isSpecial-${studio.id}`}
                className="text-sm font-bold cursor-pointer opacity-80 hover:opacity-100"
              >
                This is a Special Backdrop
              </label>
            </div>

            {localIsSpecial && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Available From
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    defaultValue={
                      studio.validFrom
                        ? new Date(studio.validFrom).toISOString().split("T")[0]
                        : ""
                    }
                    required
                    className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                    Available To
                  </label>
                  <input
                    type="date"
                    name="validTo"
                    defaultValue={
                      studio.validTo
                        ? new Date(studio.validTo).toISOString().split("T")[0]
                        : ""
                    }
                    required
                    className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                Base Premium
              </label>
              <div className="flex gap-2">
                <input
                  name="baseAdjustmentValue"
                  type="number"
                  step="any"
                  defaultValue={studio.baseAdjustmentValue || 0}
                  className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold"
                />
                <select
                  name="baseAdjustmentType"
                  defaultValue={studio.baseAdjustmentType || "fixed_amount"}
                  className="w-16 px-2 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-bold text-[10px] appearance-none"
                >
                  <option value="fixed_amount">$</option>
                  <option value="percentage">%</option>
                  <option value="fixed_override">Set</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                Slot Length (min)
              </label>
              <input
                name="sessionDuration"
                type="number"
                defaultValue={studio.sessionDuration}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">
                Max Capacity
              </label>
              <input
                name="maxCapacity"
                type="number"
                defaultValue={studio.maxCapacity}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                Theme.classes.primaryButton,
                "w-auto px-6 py-2 text-sm flex items-center gap-2",
              )}
            >
              <Save className="w-4 h-4" />{" "}
              {isSubmitting ? "Saving..." : "Save Studio"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
