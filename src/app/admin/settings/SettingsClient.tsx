"use client";

import { useState } from "react";
import { updateNotificationSettings } from "../notification-actions";
import { NotificationSetting } from "@prisma/client";
import { Save, Bell, Mail, MessageSquare } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { cn } from "@/lib/utils";

export default function SettingsClient({
  initialNotificationSettings,
}: {
  initialNotificationSettings: NotificationSetting;
}) {
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);
  const [saving, setSaving] = useState(false);

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings(notificationSettings);
      alert("Notification settings saved!");
    } catch (e) {
      alert("Error saving notification settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-black/5 dark:border-white/5 pb-6 mb-6">
        <h1 className="text-3xl tracking-tight">Notification Settings</h1>
        <p className="text-neutral-500 font-medium italic">
          Configure automated email and SMS alerts for your clients.
        </p>
      </div>

      <div className="grid gap-6">
        <div className={cn(Theme.classes.cardGlass, "p-6")}>
          <h3 className="text-lg flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
            Reminder Timing
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="w-full sm:w-48 p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
              value={notificationSettings.reminderHours}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, reminderHours: parseInt(e.target.value) || 24 })}
            />
            <span className="text-sm opacity-60">Hours before session</span>
          </div>
        </div>

        <div className={cn(Theme.classes.cardGlass, "p-6")}>
          <h3 className="text-lg flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
            SMS Content
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Confirmation SMS</label>
              <textarea
                className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
                rows={3}
                value={notificationSettings.smsConfirmationTemplate}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsConfirmationTemplate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Reminder SMS</label>
              <textarea
                className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
                rows={3}
                value={notificationSettings.smsReminderTemplate}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsReminderTemplate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={cn(Theme.classes.cardGlass, "p-6")}>
          <h3 className="text-lg flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
            Email Subjects
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Confirmation Email Subject</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
                value={notificationSettings.emailConfirmationSubject}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailConfirmationSubject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-50">Reminder Email Subject</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
                value={notificationSettings.emailReminderSubject}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailReminderSubject: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black px-8 py-3 rounded-xl font-medium transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
          >
            {saving ? "Saving..." : "Save Notifications"}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
