import { getGlobalSettings } from "../settings/settings-actions";
export const dynamic = "force-dynamic";
import ScheduleRulesClient from "./ScheduleRulesClient";

export default async function ScheduleRulesPage() {
  const settings = await getGlobalSettings();

  return (
    <div className="space-y-6">
      <ScheduleRulesClient initialSettings={settings} />
    </div>
  );
}
