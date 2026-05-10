import Link from "next/link";
import { XCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export default async function CheckoutFailurePage({
  searchParams
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="glass-panel rounded-xl p-5">
          <XCircle className="size-10 text-rio-red" />
          <h1 className="mt-4 text-3xl font-black">Pago fallido</h1>
          <p className="mt-2 text-white/60">Mercado Pago no aprobó la operación.</p>
          <div className="mt-5 flex gap-3">
            {params.order_id ? (
              <Link
                href={`/checkout/${params.order_id}`}
                className="inline-flex min-h-11 items-center rounded-lg bg-rio-cyan px-4 font-semibold text-black hover:bg-cyan-200"
              >
                Reintentar pago
              </Link>
            ) : null}
            <Link className="inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-white/70 hover:bg-white/10" href="/eventos">
              Ver eventos
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
