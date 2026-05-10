import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminEvent, getAdminTickets } from "@/lib/admin-data";
import { requirePageRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

type TicketRow = {
  id: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  status: string;
  created_at: string;
  ticket_types?: { name: string } | null;
};

export default async function EventTicketsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["owner", "admin"]);
  const { id } = await params;
  const [event, tickets] = await Promise.all([getAdminEvent(id), getAdminTickets(id)]);

  if (!event) notFound();

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Tickets</p>
        <h1 className="mt-2 text-3xl font-black">{event.name}</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="grid min-w-[760px] grid-cols-[1.3fr_1fr_1fr_1fr] bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/60">
          <span>Comprador</span>
          <span>Entrada</span>
          <span>Estado</span>
          <span>Creado</span>
        </div>
        <div className="max-w-full overflow-x-auto">
          {(tickets as TicketRow[]).map((ticket) => (
            <div key={ticket.id} className="grid min-w-[760px] grid-cols-[1.3fr_1fr_1fr_1fr] border-t border-white/10 px-4 py-3 text-sm">
              <span>
                {ticket.buyer_name} {ticket.buyer_lastname}
                <span className="block text-white/[0.45]">{ticket.buyer_email}</span>
              </span>
              <span>{ticket.ticket_types?.name}</span>
              <span>
                <StatusBadge tone={ticket.status === "valid" ? "green" : ticket.status === "used" ? "red" : "yellow"}>
                  {ticket.status}
                </StatusBadge>
              </span>
              <span className="text-white/[0.55]">{formatDateTime(ticket.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
