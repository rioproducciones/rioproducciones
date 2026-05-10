import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { EventPurchaseForm } from "@/components/events/event-purchase-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublishedEventBySlug } from "@/lib/public-data";
import { formatDateTime } from "@/lib/utils";
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

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main>
        <section className="relative min-h-[52svh] overflow-hidden">
          <Image
            src={event.cover_image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80"}
            alt={event.name}
            fill
            priority
            className="object-cover opacity-[0.56]"
          />
          <div className="absolute inset-0 bg-black/[0.68]" />
          <div className="relative mx-auto flex min-h-[52svh] max-w-6xl flex-col justify-end px-4 py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rio-cyan">
              Rio Producciones
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
              {event.name}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-rio-cyan" />
                {formatDateTime(event.event_date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-rio-cyan" />
                {event.location}
              </span>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_420px]">
          <div>
            <h2 className="text-2xl font-black">Información</h2>
            <p className="mt-4 max-w-2xl text-white/[0.64]">{event.description}</p>
          </div>
          <EventPurchaseForm eventId={event.id} ticketTypes={ticketTypes} />
        </section>
      </main>
    </div>
  );
}
