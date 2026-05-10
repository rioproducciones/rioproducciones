import { getDashboardData } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";

export default async function ReportsPage() {
  await requirePageRole(["owner", "admin"]);
  const data = await getDashboardData();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Reportes</h1>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/50">Vendido</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(data.totalSold, data.currency)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/50">Órdenes</p>
          <p className="mt-2 text-2xl font-black">{data.approvedOrders}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/50">Ingresos</p>
          <p className="mt-2 text-2xl font-black">{data.usedTickets}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/50">Pendientes</p>
          <p className="mt-2 text-2xl font-black">{data.pendingEntry}</p>
        </div>
      </div>
      <section className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-bold">Alertas de QR repetidos</h2>
        <div className="mt-3 grid gap-2">
          {data.repeatedAlerts.length ? (
            data.repeatedAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-red-400/25 bg-red-400/[0.1] p-3 text-sm">
                {alert.scan_message || "Entrada ya utilizada"}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/[0.55]">Sin repetidos recientes.</p>
          )}
        </div>
      </section>
    </div>
  );
}
