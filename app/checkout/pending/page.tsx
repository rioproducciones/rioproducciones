import { OrderStatus } from "@/components/checkout/order-status";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default async function CheckoutPendingPage({
  searchParams
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {params.order_id ? (
          <OrderStatus orderId={params.order_id} />
        ) : (
          <div className="glass-panel rounded-xl p-5">Pago pendiente. Volvé a intentar desde tu checkout.</div>
        )}
      </main>
    </div>
  );
}
