import AdminCalendarFlow from "@/components/admin/AdminCalendarFlow";

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">
          Schedule Management
        </h1>
        <p className="text-neutral-500 font-medium">
          Manually intervene in daily studio bounds. Block slots for cleaning or
          hold them internally.
        </p>
      </div>

      <div className="pt-8">
        <AdminCalendarFlow />
      </div>
    </div>
  );
}
