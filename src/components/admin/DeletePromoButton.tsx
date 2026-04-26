"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertCircle, X } from "lucide-react";
import { deletePromoRule } from "@/app/admin/promo-actions";
import { cn } from "@/lib/utils";

interface DeletePromoButtonProps {
  id: string;
}

export default function DeletePromoButton({ id }: DeletePromoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auto-reset confirmation after 3 seconds
  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => setShowConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePromoRule(id);
      if (!result.success) {
        alert(result.error || "Failed to delete rule");
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (error) {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-1 justify-end">
      {showConfirm && (
        <span className="text-[10px]  uppercase tracking-tighter text-red-500 animate-in fade-in slide-in-from-right-2 duration-300">
          Are you sure?
        </span>
      )}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        title={
          showConfirm ? "Click again to confirm delete" : "Delete Template"
        }
        className={cn(
          "p-2 rounded-xl transition-all flex items-center gap-2 group",
          showConfirm
            ? "bg-red-500 text-white shadow-lg shadow-red-500/20 px-4"
            : "hover:bg-red-500/10 text-red-500",
          isDeleting && "opacity-50 cursor-not-allowed",
        )}
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : showConfirm ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px]  uppercase tracking-widest">
              Delete
            </span>
          </>
        ) : (
          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {showConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(false);
          }}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40 hover:opacity-100 transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
