import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import { EventPurchaseForm } from "@/components/events/event-purchase-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublishedEventBySlug } from "@/lib/public-data";
import type { TicketType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) notFound();

  const ticketTypes = ((event.ticket_types || []) as TicketType[]).filter(
    (ticketType) => ticketType.is_active
  );
  const eventDate = new Date(event.event_date);
  const eventDay = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Montevideo"
  }).format(eventDate);
  const eventDayLabel = eventDay.charAt(0).toUpperCase() + eventDay.slice(1);
  const eventTime = new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo"
  }).format(eventDate);
  const availableTickets = ticketTypes.reduce(
    (sum, ticketType) => sum + Math.max(ticketType.stock - ticketType.sold_count, 0),
    0
  );

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-rio-black">
          <div className="absolute inset-0">
            <Image
              src={event.cover_image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80"}
              alt={event.name}
              fill
              priority
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,13,0.95)_0%,rgba(5,7,13,0.78)_42%,rgba(5,7,13,0.26)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-rio-black to-transparent" />
          </div>

          <div className="relative mx-auto flex min-h-[70svh] max-w-6xl items-end px-4 pb-12 pt-28">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.08] px-3 py-2 text-sm font-semibold text-white/80 backdrop-blur-md">
                <Ticket className="size-4 text-rio-cyan" />
                Entradas disponibles
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rio-cyan">
                Rio Producciones
              </p>
              <h1 className="mt-3 max-w-4xl break-words text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                {event.name}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/[0.78]">
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.07] px-3">
                  <CalendarDays className="size-4 text-rio-cyan" />
                  {eventDayLabel}
                </span>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.07] px-3">
                  <Clock3 className="size-4 text-rio-cyan" />
                  {eventTime}
                </span>
                {event.location ? (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.07] px-3">
                    <MapPin className="size-4 text-rio-cyan" />
                    {event.location}
                  </span>
                ) : null}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#comprar"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-rio-cyan px-5 font-bold text-black shadow-glow transition hover:bg-cyan-200"
                >
                  Comprar entradas
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/eventos"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.07] px-5 font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  Ver eventos
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:py-14">
          <div className="space-y-8">
            <div className="border-y border-white/10 py-5">
              <dl className="grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Fecha
                  </dt>
                  <dd className="mt-2 font-bold text-white">{eventDayLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Hora
                  </dt>
                  <dd className="mt-2 font-bold text-white">{eventTime}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Stock
                  </dt>
                  <dd className="mt-2 font-bold text-white">
                    {availableTickets > 0 ? `${availableTickets} disponibles` : "Agotado"}
                  </dd>
                </div>
              </dl>
            </div>

            <article>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rio-cyan">
                Información
              </p>
              <h2 className="mt-3 text-3xl font-black">Información del evento</h2>
              {event.description ? (
                <p className="mt-4 max-w-3xl text-lg leading-8 text-white/[0.68]">
                  {event.description}
                </p>
              ) : null}
            </article>
          </div>

          <aside id="comprar" className="scroll-mt-24 lg:-mt-28 lg:sticky lg:top-24 lg:self-start">
            <EventPurchaseForm eventId={event.id} ticketTypes={ticketTypes} />
          </aside>
        </section>
      </main>
    </div>
  );
}
