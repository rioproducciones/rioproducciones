import { RealtimeDashboard } from "@/components/admin/realtime-dashboard";
import { getDashboardData } from "@/lib/admin-data";

export default async function AdminPage() {
  const data = await getDashboardData();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Dashboard</h1>
      </div>
      <RealtimeDashboard initialData={data} />
    </div>
  );
}
