import { getNotificationSettings } from "../notification-actions";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const settings = await getNotificationSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-brand-black dark:text-brand-latte mb-2">
          Notifications
        </h1>
        <p className="text-sm opacity-70">
          Configure automated email and SMS messages for bookings and reminders.
        </p>
      </div>

      <NotificationsClient initialSettings={settings} />
    </div>
  );
}
