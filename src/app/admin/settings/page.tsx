import { getNotificationSettings } from "../notification-actions";
export const dynamic = "force-dynamic";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const notificationSettings = await getNotificationSettings();

  return (
    <div className="space-y-6">
      <SettingsClient 
        initialNotificationSettings={notificationSettings} 
      />
    </div>
  );
}
