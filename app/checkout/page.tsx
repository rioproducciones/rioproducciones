import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublishedEvents } from "@/lib/public-data";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const eventId = typeof params.event_id === "string" ? params.event_id : null;
  const rawItems = Array.isArray(params.items)
    ? params.items
    : params.items
      ? [params.items]
      : [];

  if (!eventId || rawItems.length === 0) notFound();

  const items = rawItems.flatMap((raw) => {
    const [ticketTypeId, qty] = raw.split(":");
    const quantity = parseInt(qty, 10);
    if (!ticketTypeId || isNaN(quantity) || quantity < 1) return [];
    return [{ ticket_type_id: ticketTypeId, quantity }];
  });

  if (items.length === 0) notFound();

  const events = await getPublishedEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) notFound();

  const ticketTypes = (event.ticket_types || []).filter((t) => t.is_active);
  const selectedTicketTypes = items.flatMap(({ ticket_type_id, quantity }) => {
    const tt = ticketTypes.find((t) => t.id === ticket_type_id);
    if (!tt) return [];
    return [{ ticketType: tt, quantity }];
  });

  if (selectedTicketTypes.length === 0) notFound();

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <CheckoutForm eventId={eventId} selectedItems={selectedTicketTypes} />
      </main>
    </div>
  );
}
