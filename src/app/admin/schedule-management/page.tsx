import AdminCalendarFlow from "@/components/admin/AdminCalendarFlow";

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl  tracking-tight">Schedule Management</h1>
      </div>

      <div className="pt-2">
        <AdminCalendarFlow />
      </div>
    </div>
  );
}
