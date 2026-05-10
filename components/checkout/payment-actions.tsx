"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { ApplePayPlaceholder } from "@/components/checkout/apple-pay-placeholder";
import { Button } from "@/components/ui/button";

export function PaymentActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payWithMercadoPago() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/payments/mercadopago/create-preference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ order_id: orderId })
    });

    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(result.error || "No pudimos iniciar Mercado Pago.");
      return;
    }

    window.location.href = result.init_point || result.sandbox_init_point;
  }

  return (
    <div className="grid gap-3">
      <Button onClick={payWithMercadoPago} disabled={loading} className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        Pagar con Mercado Pago
      </Button>
      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/[0.12] p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      <ApplePayPlaceholder />
      <div className="rounded-lg border border-violet-300/20 bg-violet-300/[0.08] p-4 text-sm text-violet-100">
        Crypto próximamente. Arquitectura preparada con <strong>payment_provider = crypto</strong>.
        {/* TODO: futura integración Web3 wallet / USDT. */}
      </div>
    </div>
  );
}
