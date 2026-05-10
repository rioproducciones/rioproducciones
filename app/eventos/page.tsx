import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublishedEvents } from "@/lib/public-data";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EventTicketTypeSummary = {
  price: number;
  is_active: boolean;
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rio-cyan">Eventos</p>
          <h1 className="mt-2 text-3xl font-black">Entradas disponibles</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const activePrices = (event.ticket_types || [])
              .filter((ticketType: EventTicketTypeSummary) => ticketType.is_active)
              .map((ticketType: EventTicketTypeSummary) => ticketType.price);
            const minPrice = activePrices.length ? Math.min(...activePrices) : null;

            return (
              <Link
                href={`/evento/${event.slug}`}
                key={event.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-cyan-300/40"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={event.cover_image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80"}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <StatusBadge tone="cyan">Publicado</StatusBadge>
                  <h2 className="mt-3 text-xl font-black">{event.name}</h2>
                  <p className="mt-2 text-sm text-white/[0.56]">{formatDateTime(event.event_date)}</p>
                  <p className="text-sm text-white/[0.56]">{event.location}</p>
                  <div className="mt-4 font-bold text-rio-cyan">
                    {minPrice ? `Desde ${formatMoney(minPrice)}` : "Sin entradas activas"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
