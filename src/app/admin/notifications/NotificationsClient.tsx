"use client";

import { useState } from "react";
import { updateNotificationSettings } from "../notification-actions";
import { NotificationSetting } from "@prisma/client";
import { Save, Bell, Mail, MessageSquare } from "lucide-react";
import { Theme } from "@/lib/theme.config";
import { cn } from "@/lib/utils";

export default function NotificationsClient({
  initialSettings,
}: {
  initialSettings: NotificationSetting;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings(settings);
      alert("Settings saved successfully!");
    } catch (e) {
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Reminder Scheduling */}
      <div className={cn(Theme.classes.cardGlass, "p-6")}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
          Scheduling
        </h3>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Send Reminders Before Booking (Hours)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            className="w-full sm:w-48 p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
            value={settings.reminderHours}
            onChange={(e) =>
              setSettings({ ...settings, reminderHours: parseInt(e.target.value) || 24 })
            }
          />
          <p className="text-xs opacity-60 mt-2">
            Example: 24 = Exactly 24 hours before the booking starts.
          </p>
        </div>
      </div>

      {/* SMS Templates */}
      <div className={cn(Theme.classes.cardGlass, "p-6")}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
          SMS Templates
        </h3>
        <p className="text-xs font-semibold mb-4 opacity-70">
          Available tags: {"{{customerName}}"}, {"{{studioName}}"}, {"{{locationName}}"}, {"{{time}}"}
        </p>

        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Confirmation SMS</label>
            <textarea
              className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
              rows={3}
              value={settings.smsConfirmationTemplate}
              onChange={(e) =>
                setSettings({ ...settings, smsConfirmationTemplate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Reminder SMS</label>
            <textarea
              className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
              rows={3}
              value={settings.smsReminderTemplate}
              onChange={(e) =>
                setSettings({ ...settings, smsReminderTemplate: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Email Subject Templates */}
      <div className={cn(Theme.classes.cardGlass, "p-6")}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-brand-blue dark:text-brand-jasmine" />
          Email Subject Templates
        </h3>
        <p className="text-xs font-semibold mb-4 opacity-70">
          Note: To edit the full email HTML content, modify the React Email components in src/emails.
        </p>

        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Confirmation Subject</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
              value={settings.emailConfirmationSubject}
              onChange={(e) =>
                setSettings({ ...settings, emailConfirmationSubject: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Reminder Subject</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl bg-white/70 dark:bg-brand-black/50 border border-white/50 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-black dark:focus:ring-brand-latte transition-all"
              value={settings.emailReminderSubject}
              onChange={(e) =>
                setSettings({ ...settings, emailReminderSubject: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
