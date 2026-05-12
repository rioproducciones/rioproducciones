import { notFound } from "next/navigation";
import { PaymentActions } from "@/components/checkout/payment-actions";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { isFreeCheckoutEnabled } from "@/lib/payment-providers";
import { getOrderSummary } from "@/lib/public-data";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CheckoutEvent = {
  name: string;
  event_date: string;
  location: string | null;
};

type CheckoutItem = {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ticket_types?: { name: string } | null;
};

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderSummary(orderId);

  if (!order) notFound();
  const isApproved = order.payment_status === "approved";
  const checkoutEvent = (Array.isArray(order.events) ? order.events[0] : order.events) as
    | CheckoutEvent
    | null;
  const orderItems = (order.order_items as unknown as Array<
    Omit<CheckoutItem, "ticket_types"> & {
      ticket_types?: { name: string } | { name: string }[] | null;
    }
  >).map((item) => ({
    ...item,
    ticket_types: Array.isArray(item.ticket_types)
      ? item.ticket_types[0] || null
      : item.ticket_types || null
  }));

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 lg:grid-cols-[1fr_420px]">
        <section className="glass-panel rounded-xl p-5">
          <StatusBadge tone={isApproved ? "green" : "yellow"}>
            {isApproved ? "Orden aprobada" : "Orden pendiente"}
          </StatusBadge>
          <h1 className="mt-3 text-3xl font-black">Resumen de compra</h1>
          <div className="mt-5 rounded-lg border border-white/10 bg-black/[0.24] p-4">
            <h2 className="font-bold">{checkoutEvent?.name}</h2>
            <p className="mt-1 text-sm text-white/[0.54]">
              {checkoutEvent?.event_date ? formatDateTime(checkoutEvent.event_date) : ""}
            </p>
            <p className="text-sm text-white/[0.54]">{checkoutEvent?.location}</p>
          </div>
          <div className="mt-4 grid gap-2">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3"
              >
                <div>
                  <p className="font-semibold">{item.ticket_types?.name}</p>
                  <p className="text-sm text-white/[0.48]">
                    {item.quantity} x {formatMoney(item.unit_price, order.currency)}
                  </p>
                </div>
                <p className="font-bold">{formatMoney(item.subtotal, order.currency)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-white/60">Total</span>
            <span className="text-2xl font-black">{formatMoney(order.total_amount, order.currency)}</span>
          </div>
        </section>
        <aside className="glass-panel h-fit rounded-xl p-5">
          <h2 className="mb-4 text-xl font-black">Pago</h2>
          <PaymentActions
            orderId={order.id}
            enableFreeCheckout={isFreeCheckoutEnabled()}
            paymentStatus={order.payment_status}
          />
        </aside>
      </main>
    </div>
  );
}
