"use client";

import { useState } from "react";
import { CreditCard, Gift, Loader2 } from "lucide-react";
import { ApplePayPlaceholder } from "@/components/checkout/apple-pay-placeholder";
import { Button } from "@/components/ui/button";

type PaymentActionsProps = {
  orderId: string;
  enableFreeCheckout?: boolean;
  paymentStatus?: string;
};

export function PaymentActions({
  orderId,
  enableFreeCheckout = false,
  paymentStatus
}: PaymentActionsProps) {
  const [loadingAction, setLoadingAction] = useState<"mercadopago" | "free" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = Boolean(loadingAction);

  async function payWithMercadoPago() {
    setLoadingAction("mercadopago");
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
      setLoadingAction(null);
      setError(result.error || "No pudimos iniciar Mercado Pago.");
      return;
    }

    window.location.href = result.init_point || result.sandbox_init_point;
  }

  async function approveFreeOrder() {
    setLoadingAction("free");
    setError(null);

    const response = await fetch("/api/payments/free/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ order_id: orderId })
    });

    const result = await response.json();

    if (!response.ok) {
      setLoadingAction(null);
      setError(result.error || "No pudimos generar el QR gratis.");
      return;
    }

    window.location.href = result.redirect_url || `/checkout/success?order_id=${orderId}`;
  }

  if (paymentStatus === "approved") {
    return (
      <div className="rounded-lg border border-rio-green/30 bg-rio-green/[0.12] p-4 text-sm text-green-50">
        Esta orden ya está aprobada. Tus QR están disponibles en la confirmación de compra.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Button onClick={payWithMercadoPago} disabled={loading} className="w-full">
        {loadingAction === "mercadopago" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        Pagar con Mercado Pago
      </Button>
      {enableFreeCheckout ? (
        <Button onClick={approveFreeOrder} disabled={loading} variant="success" className="w-full">
          {loadingAction === "free" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Gift className="size-4" />
          )}
          Generar QR gratis
        </Button>
      ) : null}
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
