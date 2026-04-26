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
    setIsDeleting(true);
    const result = await deleteStudio(studio.id);
    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Failed to delete" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-brand-latte/[0.02] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden transition-all relative">
      {message && (
        <div
          className={cn(
            "p-3 mx-5 mt-4 rounded-xl text-xs  animate-in slide-in-from-top-2 duration-300 flex justify-between items-center",
            message.type === "success"
              ? "bg-green-500/10 text-green-600"
              : "bg-red-500/10 text-red-600",
          )}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
      <div
        className="p-5 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <div className=" text-lg flex items-center gap-3">
            {studio.name}
            {studio.isSpecial && (
              <span className="text-[10px] px-2 py-1 bg-brand-yellow/10 text-brand-yellow rounded uppercase ">
                SPECIAL
              </span>
            )}
          </div>
          <div className="text-sm opacity-60 mt-1 font-medium flex gap-4">
            <span>Duration: {studio.sessionDuration}m</span>
            {studio.roomId && (
              <span>Room: {studio.roomId.replace("ROOM_", "")}</span>
            )}
            {studio.baseAdjustmentValue !== 0 && (
              <span className="text-brand-yellow ">
                Premium: {studio.baseAdjustmentValue > 0 ? "+" : ""}$
                {studio.baseAdjustmentValue}
              </span>
            )}
            {studio.validFrom && (
              <span className="text-brand-blue ">
                {new Date(studio.validFrom).toLocaleDateString()} -{" "}
                {new Date(studio.validTo).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {studio.isSpecial && (
            <>
              {showConfirmDelete ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                  <span className="text-[10px]  uppercase tracking-wider opacity-50">
                    Confirm Delete?
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmDelete(false);
                    }}
                    disabled={isDeleting}
                    className="px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-[10px]  uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDelete(true);
                  }}
                  disabled={isDeleting}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all group"
                  title={`Delete ${studio.name}`}
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </>
          )}
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
          {/* Form Content */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs  uppercase tracking-widest opacity-40 ml-1">
                Display Name
              </label>
              <input
                name="name"
                defaultValue={studio.name}
                required
                disabled={!studio.isSpecial}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs  uppercase tracking-widest opacity-40 ml-1">
                Physical Room
              </label>
              <select
                name="roomId"
                defaultValue={studio.roomId || "ROOM_WHITE"}
                disabled={!studio.isSpecial}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold appearance-none disabled:opacity-50"
              >
                <option value="ROOM_WHITE">White Room</option>
                <option value="ROOM_BLACK">Black Room</option>
              </select>
            </div>
          </div>

          {studio.isSpecial ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="space-y-1.5">
                <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-1">
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
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px]  uppercase tracking-widest opacity-40 ml-1">
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
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-semibold"
                />
              </div>
              <input type="hidden" name="isSpecial" value="true" />
            </div>
          ) : (
            <input type="hidden" name="isSpecial" value="false" />
          )}

          <div className="grid grid-cols-3 gap-4 border-t border-black/5 dark:border-white/5 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs  uppercase tracking-widest opacity-40 ml-1">
                Base Premium ($)
              </label>
              <input
                name="baseAdjustmentValue"
                type="number"
                step="any"
                disabled={!studio.isSpecial}
                defaultValue={studio.baseAdjustmentValue || 0}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono  disabled:opacity-50"
              />
              <input
                type="hidden"
                name="baseAdjustmentType"
                value="fixed_amount"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs  uppercase tracking-widest opacity-40 ml-1">
                Slot Length (min)
              </label>
              <input
                name="sessionDuration"
                type="number"
                disabled={!studio.isSpecial}
                defaultValue={studio.sessionDuration}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#111] border border-transparent focus:border-brand-blue/50 outline-none transition-all font-mono  disabled:opacity-50"
              />
            </div>
          </div>

          {studio.isSpecial && (
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
          )}
        </form>
      )}
    </div>
  );
}
