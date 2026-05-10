import { Suspense } from "react";
import { OrderStatus } from "@/components/checkout/order-status";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
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
          <Suspense fallback={null}>
            <OrderStatus orderId={params.order_id} />
          </Suspense>
        ) : (
          <div className="glass-panel rounded-xl p-5">No encontramos la orden en el retorno.</div>
        )}
      </main>
    </div>
  );
}
