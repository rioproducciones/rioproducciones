import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, Ticket } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminEvent } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";

type TicketTypeRow = {
  id: string;
  name: string;
  price: number;
  currency: string;
  sold_count: number;
  stock: number;
};

export default async function AdminEventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["owner", "admin"]);
  const { id } = await params;
  const event = await getAdminEvent(id);

  if (!event) notFound();

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusBadge tone={event.status === "published" ? "green" : "neutral"}>
            {event.status}
          </StatusBadge>
          <h1 className="mt-3 text-3xl font-black">{event.name}</h1>
          <p className="mt-2 text-white/60">{formatDateTime(event.event_date)} · {event.location}</p>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 font-semibold hover:bg-white/10" href={`/admin/eventos/${event.id}/tickets`}>
            <Ticket className="size-4" />
            Tickets
          </Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rio-cyan px-4 font-semibold text-black" href={`/admin/eventos/${event.id}/editar`}>
            <Edit className="size-4" />
            Editar
          </Link>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {((event.ticket_types || []) as TicketTypeRow[]).map((ticketType) => (
          <div key={ticketType.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <h2 className="font-bold">{ticketType.name}</h2>
            <p className="mt-2 text-2xl font-black text-rio-cyan">{formatMoney(ticketType.price, ticketType.currency)}</p>
            <p className="mt-2 text-sm text-white/[0.55]">
              {ticketType.sold_count} vendidos / {ticketType.stock} stock
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
