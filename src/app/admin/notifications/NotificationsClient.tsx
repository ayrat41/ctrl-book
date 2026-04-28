"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  RefreshCcw,
  Clock
} from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { clsx } from "clsx";

export default function NotificationsClient({ initialSettings, initialLogs }: any) {
  const [activeTab, setActiveTab] = useState<"templates" | "logs">("templates");
  const [settings, setSettings] = useState(initialSettings || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const placeholders = ["{{customerName}}", "{{studioName}}", "{{locationName}}", "{{time}}", "{{manageUrl}}"];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaveStatus("success");
      else setSaveStatus("error");
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleResend = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await fetch("/api/admin/notifications/resend", {
        method: "POST",
        body: JSON.stringify({ logId }),
      });
      if (res.ok) alert("Notification resent successfully!");
      else alert("Failed to resend notification.");
    } catch (e) {
      alert("Error retrying notification.");
    } finally {
      setRetryingId(null);
    }
  };

  const TemplateField = ({ label, value, field, type = "text" }: any) => (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center">
        <label className="text-sm font-rag-bold text-brand-black/60 group-hover:text-brand-blue transition-colors uppercase tracking-wider">
          {label}
        </label>
        <div className="flex gap-1">
          {placeholders.map((p) => (
            <button
              key={p}
              onClick={() => setSettings({ ...settings, [field]: (settings[field] || "") + p })}
              className="text-[10px] px-1.5 py-0.5 rounded bg-brand-latte border border-brand-black/5 hover:border-brand-jasmine hover:bg-brand-jasmine/10 transition-all text-brand-black/40 hover:text-brand-black"
            >
              {p.replace("{{", "").replace("}}", "")}
            </button>
          ))}
        </div>
      </div>
      {type === "textarea" ? (
        <textarea
          value={settings[field] || ""}
          onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
          rows={3}
          className="w-full bg-white border border-brand-black/10 rounded-xl px-4 py-3 text-brand-black font-rag-regular focus:outline-none focus:ring-2 focus:ring-brand-jasmine/50 focus:border-brand-jasmine transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={settings[field] || ""}
          onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
          className="w-full bg-white border border-brand-black/10 rounded-xl px-4 py-3 text-brand-black font-rag-regular focus:outline-none focus:ring-2 focus:ring-brand-jasmine/50 focus:border-brand-jasmine transition-all"
        />
      )}
    </div>
  );

  return (
    <div className={clsx(Theme.classes.widgetGlass, "p-1 overflow-hidden")}>
      {/* Tab Navigation */}
      <div className="flex bg-brand-latte/50 p-1 rounded-t-2xl gap-1">
        <button
          onClick={() => setActiveTab("templates")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-rag-bold text-sm transition-all",
            activeTab === "templates" ? "bg-white text-brand-blue shadow-sm" : "text-brand-black/40 hover:bg-white/50"
          )}
        >
          <Bell size={16} /> Notification Templates
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-rag-bold text-sm transition-all",
            activeTab === "logs" ? "bg-white text-brand-blue shadow-sm" : "text-brand-black/40 hover:bg-white/50"
          )}
        >
          <History size={16} /> Notification Logs
        </button>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "templates" ? (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Scheduling Config */}
              <div className="bg-brand-latte/30 p-4 rounded-2xl flex items-center justify-between border border-brand-black/5">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-jasmine p-2 rounded-lg text-brand-black">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-rag-bold text-brand-black">Reminder Threshold</div>
                    <div className="text-xs text-brand-black/40">How many hours before the session to send SMS/Email</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.reminderHours || 24}
                    onChange={(e) => setSettings({ ...settings, reminderHours: parseInt(e.target.value) || 24 })}
                    className="w-20 text-center bg-white border border-brand-black/10 rounded-lg py-2 font-rag-bold focus:ring-2 focus:ring-brand-jasmine/50"
                  />
                  <span className="text-sm font-rag-bold text-brand-black/40">Hours</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SMS SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-black/5">
                    <MessageSquare size={18} className="text-brand-blue" />
                    <h2 className="font-rag-bold text-lg">SMS Templates</h2>
                  </div>
                  <TemplateField label="Confirmation SMS" field="smsConfirmationTemplate" type="textarea" />
                  <TemplateField label="Reminder SMS" field="smsReminderTemplate" type="textarea" />
                  <TemplateField label="Reschedule SMS" field="smsRescheduleTemplate" type="textarea" />
                  <TemplateField label="Cancellation SMS" field="smsCancellationTemplate" type="textarea" />
                </div>

                {/* EMAIL SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-black/5">
                    <Mail size={18} className="text-brand-blue" />
                    <h2 className="font-rag-bold text-lg">Email Subjects</h2>
                  </div>
                  <TemplateField label="Confirmation Subject" field="emailConfirmationSubject" />
                  <TemplateField label="Reminder Subject" field="emailReminderSubject" />
                  <TemplateField label="Reschedule Subject" field="emailRescheduleSubject" />
                  <TemplateField label="Cancellation Subject" field="emailCancellationSubject" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-brand-black/5">
                {saveStatus === "success" && (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-rag-bold">
                    <CheckCircle2 size={16} /> Saved Successfully
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-red-600 text-sm font-rag-bold">
                    <AlertCircle size={16} /> Error Saving
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={clsx(
                    Theme.classes.primaryButton,
                    "flex items-center gap-2 px-8",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save All Templates"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-brand-black/40 text-[11px] uppercase tracking-widest font-rag-bold">
                      <th className="px-4 pb-2">Sent At</th>
                      <th className="px-4 pb-2">Customer</th>
                      <th className="px-4 pb-2">Type</th>
                      <th className="px-4 pb-2">Channel</th>
                      <th className="px-4 pb-2">Status</th>
                      <th className="px-4 pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {initialLogs.map((log: any) => (
                      <tr key={log.id} className="group bg-white/50 hover:bg-white transition-all shadow-sm rounded-xl">
                        <td className="px-4 py-3 text-xs font-rag-regular rounded-l-xl border-y border-l border-brand-black/5">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-y border-brand-black/5">
                          <div className="text-sm font-rag-bold text-brand-black">{log.booking?.customer?.fullName || "System"}</div>
                          <div className="text-[10px] text-brand-black/40">{log.booking?.customer?.email}</div>
                        </td>
                        <td className="px-4 py-3 border-y border-brand-black/5">
                          <span className={clsx(
                            "text-[10px] font-rag-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                            log.type === 'confirmation' && "bg-green-100 text-green-700",
                            log.type === 'reminder' && "bg-blue-100 text-blue-700",
                            log.type === 'cancellation' && "bg-red-100 text-red-700",
                            log.type === 'reschedule' && "bg-brand-jasmine/30 text-brand-black"
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-y border-brand-black/5">
                          {log.channel === "sms" ? (
                            <div className="flex items-center gap-1 text-brand-blue font-rag-bold text-[10px]">
                              <MessageSquare size={12} /> SMS
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-brand-blue font-rag-bold text-[10px]">
                              <Mail size={12} /> EMAIL
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 border-y border-brand-black/5">
                          {log.status === "success" ? (
                            <span className="flex items-center gap-1 text-green-600 text-[10px] font-rag-bold">
                              <CheckCircle2 size={12} /> Delivered
                            </span>
                          ) : (
                            <div className="group relative cursor-help">
                              <span className="flex items-center gap-1 text-red-600 text-[10px] font-rag-bold underline decoration-dotted">
                                <AlertCircle size={12} /> Failed
                              </span>
                              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-red-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                {log.errorMessage || "System delivery error."}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 rounded-r-xl border-y border-r border-brand-black/5">
                          {log.status === "failed" && (
                            <button 
                              onClick={() => handleResend(log.id)}
                              disabled={retryingId === log.id}
                              className={clsx(
                                "text-brand-blue hover:text-brand-jasmine flex items-center gap-1 text-[10px] font-rag-bold transition-colors",
                                retryingId === log.id && "opacity-50 animate-pulse"
                              )}
                            >
                              <RefreshCcw size={12} className={clsx(retryingId === log.id && "animate-spin")} /> 
                              {retryingId === log.id ? "Retrying..." : "Retry"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {initialLogs.length === 0 && (
                  <div className="text-center py-12 text-brand-black/30 font-rag-bold">
                    No notifications sent yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
