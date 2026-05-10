"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Radio } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatDateTime, formatMoney } from "@/lib/utils";

type CheckinRow = {
  id: string;
  scan_result: string;
  scan_message: string | null;
  scanned_at: string;
  gate_name: string | null;
  events?: { name: string } | null;
  tickets?: {
    buyer_name: string;
    buyer_lastname: string | null;
    buyer_email: string;
    ticket_types?: { name: string } | null;
  } | null;
  profiles?: { full_name: string | null } | null;
};

export function RealtimeDashboard({
  initialData
}: {
  initialData: {
    totalSold: number;
    currency: string;
    approvedOrders: number;
    soldTickets: number;
    usedTickets: number;
    pendingEntry: number;
    salesByType: Array<{ id: string; name: string; count: number; amount: number; currency: string }>;
    lastCheckins: CheckinRow[];
    repeatedAlerts: CheckinRow[];
  };
}) {
  const [lastCheckins, setLastCheckins] = useState(initialData.lastCheckins);
  const [usedCount, setUsedCount] = useState(initialData.usedTickets);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("rio-admin-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        (payload) => {
          setLive(true);
          setLastCheckins((current) => [payload.new as CheckinRow, ...current].slice(0, 30));
          if ((payload.new as { scan_result?: string }).scan_result === "valid") {
            setUsedCount((current) => current + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total vendido", value: formatMoney(initialData.totalSold, initialData.currency) },
      { label: "Órdenes approved", value: initialData.approvedOrders },
      { label: "Tickets vendidos", value: initialData.soldTickets },
      { label: "Ingresos", value: usedCount },
      { label: "Pendientes de ingreso", value: Math.max(initialData.pendingEntry - (usedCount - initialData.usedTickets), 0) }
    ],
    [initialData, usedCount]
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-rio-cyan">
        <Radio className={live ? "size-4 animate-pulse" : "size-4"} />
        Realtime activo
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Activity className="size-4 text-rio-cyan" />
            Últimos check-ins
          </h2>
          <div className="mt-3 grid gap-2">
            {lastCheckins.slice(0, 8).map((checkin, index) => (
              <div key={checkin.id || index} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{checkin.tickets?.buyer_name || "Scan"}</p>
                  <span className="text-xs text-white/[0.45]">{checkin.scan_result}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {checkin.scanned_at ? formatDateTime(checkin.scanned_at) : "Ahora"}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="font-bold">Ventas por tipo</h2>
          <div className="mt-3 grid gap-2">
            {initialData.salesByType.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
                <span>{item.name}</span>
                <span className="font-semibold">
                  {item.count} · {formatMoney(item.amount, item.currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
