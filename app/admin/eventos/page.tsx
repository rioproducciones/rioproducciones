import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminEvents } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";

type AdminEventRow = {
  id: string;
  name: string;
  event_date: string;
  status: string;
  ticket_types?: Array<{
    sold_count: number;
    price: number;
  }>;
};

export default async function AdminEventsPage() {
  await requirePageRole(["owner", "admin"]);
  const events = (await getAdminEvents()) as AdminEventRow[];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Admin</p>
          <h1 className="mt-2 text-3xl font-black">Eventos</h1>
        </div>
        <Link
          href="/admin/eventos/nuevo"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rio-cyan px-4 font-semibold text-black"
        >
          <Plus className="size-4" />
          Nuevo
        </Link>
      </div>
      <div className="grid gap-3">
        {events.map((event) => {
          const sold = (event.ticket_types || []).reduce(
            (sum, ticketType) => sum + ticketType.sold_count,
            0
          );
          const revenue = (event.ticket_types || []).reduce(
            (sum, ticketType) => sum + ticketType.sold_count * ticketType.price,
            0
          );

          return (
            <Link
              key={event.id}
              href={`/admin/eventos/${event.id}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:border-cyan-300/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <StatusBadge tone={event.status === "published" ? "green" : "neutral"}>
                    {event.status}
                  </StatusBadge>
                  <h2 className="mt-3 text-xl font-black">{event.name}</h2>
                  <p className="mt-1 text-sm text-white/[0.55]">{formatDateTime(event.event_date)}</p>
                </div>
                <div className="text-sm text-white/[0.65] sm:text-right">
                  <p>{sold} tickets vendidos</p>
                  <p className="font-bold text-rio-cyan">{formatMoney(revenue)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
