import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { TicketQr } from "@/components/tickets/ticket-qr";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTicketByToken } from "@/lib/public-data";
import { getTicketUrl } from "@/lib/tickets";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TicketEvent = {
  name: string;
  event_date: string;
  location: string | null;
};

type TicketTypeInfo = {
  name: string;
};

export default async function TicketPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ticket = await getTicketByToken(token);

  if (!ticket) notFound();

  const event = (Array.isArray(ticket.events) ? ticket.events[0] : ticket.events) as
    | TicketEvent
    | null;
  const ticketType = (Array.isArray(ticket.ticket_types)
    ? ticket.ticket_types[0]
    : ticket.ticket_types) as TicketTypeInfo | null;
  const statusTone = ticket.status === "valid" ? "green" : ticket.status === "used" ? "red" : "yellow";

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-6">
        <section className="glass-panel rounded-xl p-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-rio-cyan text-black">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black">{event?.name || "Entrada Rio"}</h1>
          <p className="mt-2 text-white/60">{ticketType?.name || "Entrada"}</p>
          <div className="mt-3">
            <StatusBadge tone={statusTone}>{ticket.status}</StatusBadge>
          </div>
          <div className="mt-5 flex justify-center">
            <TicketQr value={getTicketUrl(ticket.qr_token)} />
          </div>
          <p className="mt-4 break-all font-mono text-xs text-white/[0.42]">{ticket.qr_token.slice(-12).toUpperCase()}</p>
          <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-black/[0.24] p-4 text-left text-sm">
            <p className="font-semibold">
              {ticket.buyer_name} {ticket.buyer_lastname}
            </p>
            <p className="flex items-center gap-2 text-white/[0.58]">
              <CalendarDays className="size-4 text-rio-cyan" />
              {event?.event_date ? formatDateTime(event.event_date) : ""}
            </p>
            <p className="flex items-center gap-2 text-white/[0.58]">
              <MapPin className="size-4 text-rio-cyan" />
              {event?.location}
            </p>
            {ticket.buyer_document ? (
              <p className="text-white/[0.58]">Documento: {ticket.buyer_document}</p>
            ) : null}
          </div>
          <p className="mt-5 text-sm text-white/[0.56]">Presentá este QR en la entrada del evento.</p>
        </section>
        <Link
          href="/eventos"
          className="mt-4 inline-flex w-full min-h-11 items-center justify-center rounded-lg border border-white/10 text-sm font-semibold text-white/70 hover:bg-white/10"
        >
          Ver más eventos
        </Link>
      </main>
    </div>
  );
}
