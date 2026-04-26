"use client";

import { useState, useEffect } from "react";
import { format, differenceInHours } from "date-fns";
import {
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { cancelBooking } from "@/app/admin/bookings/booking-actions";

type Booking = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  customer: {
    fullName: string;
  };
  studio: {
    name: string;
    location: {
      name: string;
    };
  };
};

const SURVEY_QUESTIONS = [
  "Scheduling conflict",
  "Found a better price elsewhere",
  "Personal emergency",
  "No longer need the studio",
  "Other",
];

export default function ManageReservationClient({
  booking: initialBooking,
}: {
  booking: any;
}) {
  const [booking, setBooking] = useState<Booking>({
    ...initialBooking,
    startTime: new Date(initialBooking.startTime),
    endTime: new Date(initialBooking.endTime),
  });

  const [step, setStep] = useState<"view" | "convince" | "survey" | "success">(
    "view",
  );
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const hoursUntilStart = differenceInHours(booking.startTime, new Date());
  const canCancel = hoursUntilStart >= 24 && booking.status !== "cancelled";

  const handleFinalCancel = async () => {
    setIsProcessing(true);
    const res = await cancelBooking(
      booking.id,
      `Customer Cancelled: ${reason}`,
    );
    if (res.success) {
      setStep("success");
      setBooking((prev) => ({ ...prev, status: "cancelled" }));
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-brand-latte dark:bg-brand-black p-4 sm:p-8 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">
          {/* STEP 1: VIEW DETAILS */}
          {step === "view" && (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl  tracking-tight">Your Reservation</h1>
                <p className="text-neutral-500 font-medium italic">
                  Managed by ctrl-book
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl border border-black/5 dark:border-white/10 space-y-8">
                <div className="flex items-center gap-4 p-4 bg-brand-black/5 dark:bg-white/5 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-brand-black dark:bg-brand-latte flex items-center justify-center">
                    <Calendar className="text-brand-latte dark:text-brand-black w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px]  uppercase tracking-widest opacity-40">
                      Booking For
                    </p>
                    <p className=" text-lg">{booking.customer.fullName}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 mt-1 opacity-40" />
                    <div>
                      <p className=" text-sm uppercase tracking-wider">
                        {booking.studio.name}
                      </p>
                      <p className="text-sm opacity-60">
                        {booking.studio.location.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 mt-1 opacity-40" />
                    <div>
                      <p className=" text-sm uppercase tracking-wider">
                        {format(booking.startTime, "EEEE, MMM d")}
                      </p>
                      <p className="text-sm opacity-60">
                        {format(booking.startTime, "h:mm a")} -{" "}
                        {format(booking.endTime, "h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="pt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px]  uppercase tracking-widest opacity-40 mb-1">
                      Status
                    </p>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px]  uppercase tracking-widest",
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600",
                      )}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {booking.status !== "cancelled" && (
                    <div className="text-right">
                      <p className="text-[10px]  uppercase tracking-widest opacity-40 mb-1">
                        Cancellation
                      </p>
                      <p
                        className={cn(
                          "text-xs ",
                          canCancel ? "text-green-600" : "text-red-500",
                        )}
                      >
                        {canCancel ? "Available" : "Not allowed (<24h)"}
                      </p>
                    </div>
                  )}
                </div>

                {canCancel && (
                  <button
                    onClick={() => setStep("convince")}
                    className="w-full py-5 rounded-2xl border-2 border-red-500/20 text-red-500  text-xs uppercase tracking-[0.2em] hover:bg-red-500/5 transition-all"
                  >
                    Cancel Reservation
                  </button>
                )}

                {!canCancel && booking.status !== "cancelled" && (
                  <div className="p-4 bg-amber-500/10 rounded-2xl flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                      Our policy requires 24 hours notice for cancellations.
                      Please contact us directly if you have an emergency.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: CONVINCE */}
          {step === "convince" && (
            <motion.div
              key="convince"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 shadow-2xl border-4 border-brand-yellow/30 space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-10 h-10 text-brand-yellow" />
              </div>
              <h2 className="text-2xl  tracking-tight">
                We&apos;re sorry to see you go!
              </h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                <p>
                  We’ve reserved this time specifically for your creative
                  vision. Every cancelled slot is a missed opportunity for
                  another creator.
                </p>
                <div className="p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 italic text-sm">
                  &ldquo;Creativity takes courage.&rdquo; — Henri Matisse
                </div>
                <p>
                  Would you consider keeping your reservation? We can&apos;t
                  wait to see what you create.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => setStep("view")}
                  className="w-full py-5 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black rounded-2xl  text-xs uppercase tracking-widest shadow-xl"
                >
                  Keep My Reservation
                </button>
                <button
                  onClick={() => setStep("survey")}
                  className="w-full py-4 text-neutral-400 hover:text-red-500  text-xs uppercase tracking-widest transition-colors"
                >
                  I still need to cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SURVEY */}
          {step === "survey" && (
            <motion.div
              key="survey"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 shadow-2xl space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl  tracking-tight">Help us improve</h2>
                <p className="text-neutral-500 font-medium">
                  Please select a reason for your cancellation:
                </p>
              </div>

              <div className="space-y-3">
                {SURVEY_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setReason(q)}
                    className={cn(
                      "w-full p-5 rounded-2xl border text-left  text-sm transition-all flex items-center justify-between group",
                      reason === q
                        ? "border-brand-black bg-brand-black text-white dark:border-brand-latte dark:bg-brand-latte dark:text-brand-black"
                        : "border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white",
                    )}
                  >
                    {q}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        reason === q
                          ? "border-white dark:border-black bg-white dark:bg-black"
                          : "border-black/20 group-hover:border-black/40",
                      )}
                    >
                      {reason === q && (
                        <div className="w-2 h-2 rounded-full bg-brand-black dark:bg-brand-latte" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  disabled={!reason || isProcessing}
                  onClick={handleFinalCancel}
                  className="w-full py-5 bg-red-500 text-white rounded-2xl  text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirm Cancellation <XCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => setStep("view")}
                  className="w-full py-4 text-neutral-400  text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-12 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl  tracking-tight">Cancelled</h2>
                <p className="text-neutral-500 font-medium">
                  Your reservation has been removed from our system.
                </p>
              </div>
              <p className="text-sm opacity-60 font-medium leading-relaxed">
                We hope to see you back soon! You will receive a confirmation
                email shortly regarding your cancellation and refund status.
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full py-4 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black rounded-2xl  text-xs uppercase tracking-widest mt-4"
              >
                Back to Website
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-30  text-[10px] uppercase tracking-widest">
          <MessageSquare className="w-3 h-3" /> Powered by ctrl-book reservation
          system
        </div>
      </div>
    </div>
  );
}
