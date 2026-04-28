import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const settings = await prisma.notificationSetting.findUnique({ where: { id: "default" } });
  
  const logs = await prisma.notificationLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      booking: {
        include: {
          customer: true,
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <NotificationsClient initialSettings={settings} initialLogs={logs} />
    </div>
  );
}
