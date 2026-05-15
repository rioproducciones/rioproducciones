"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { CardForm, type CardData } from "@/components/checkout/card-form";
import type { TicketType } from "@/lib/types";

type SelectedItem = {
  ticketType: TicketType;
  quantity: number;
};

type CheckoutFormProps = {
  eventId: string;
  selectedItems: SelectedItem[];
};

type Buyer = {
  buyer_name: string;
  buyer_lastname: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string;
};

export function CheckoutForm({ eventId, selectedItems }: CheckoutFormProps) {
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer>({
    buyer_name: "",
    buyer_lastname: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_document: ""
  });
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: "",
    cardholderName: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = selectedItems.reduce(
    (sum, item) => sum + item.ticketType.price * item.quantity,
    0
  );
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const currency = selectedItems[0]?.ticketType.currency;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar datos de la tarjeta
    if (
      !cardData.cardNumber ||
      cardData.cardNumber.length !== 16 ||
      !cardData.expirationMonth ||
      !cardData.expirationYear ||
      !cardData.securityCode ||
      cardData.securityCode.length < 3
    ) {
      setLoading(false);
      setError("Por favor completa correctamente los datos de la tarjeta.");
      return;
    }

    // Primero crear la orden
    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        payment_provider: "mercadopago",
        ...buyer,
        items: selectedItems.map((item) => ({
          ticket_type_id: item.ticketType.id,
          quantity: item.quantity
        }))
      })
    });

    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      setLoading(false);
      setError(orderResult.error || "No pudimos crear la orden.");
      return;
    }

    // Luego procesar el pago con la tarjeta
    const paymentResponse = await fetch("/api/payments/mercadopago/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderResult.order_id,
        card: {
          number: cardData.cardNumber,
          holder: {
            name: cardData.cardholderName
          },
          expiration_month: cardData.expirationMonth,
          expiration_year: cardData.expirationYear,
          security_code: cardData.securityCode
        }
      })
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      setLoading(false);
      setError(paymentResult.error || "El pago fue rechazado. Intenta nuevamente.");
      return;
    }

    router.push(`/checkout/success?order_id=${paymentResult.order_id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="grid gap-6">
        <section className="rounded-xl border border-white/[0.12] bg-[#080d17]/95 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/[0.72]">
            <UserRound className="size-4 text-rio-cyan" />
            Datos del comprador
          </div>
          <form id="checkout-form" onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              required
              disabled={loading}
              aria-label="Nombre"
              placeholder="Nombre"
              value={buyer.buyer_name}
              onChange={(e) => setBuyer({ ...buyer, buyer_name: e.target.value })}
            />
            <Input
              disabled={loading}
              aria-label="Apellido"
              placeholder="Apellido"
              value={buyer.buyer_lastname}
              onChange={(e) => setBuyer({ ...buyer, buyer_lastname: e.target.value })}
            />
            <Input
              required
              disabled={loading}
              aria-label="Email"
              type="email"
              placeholder="Email"
              value={buyer.buyer_email}
              onChange={(e) => setBuyer({ ...buyer, buyer_email: e.target.value })}
            />
            <Input
              required
              disabled={loading}
              aria-label="Teléfono"
              placeholder="Teléfono"
              value={buyer.buyer_phone}
              onChange={(e) => setBuyer({ ...buyer, buyer_phone: e.target.value })}
            />
            <Input
              disabled={loading}
              aria-label="Documento o CI"
              className="sm:col-span-2"
              placeholder="Documento / CI (opcional)"
              value={buyer.buyer_document}
              onChange={(e) => setBuyer({ ...buyer, buyer_document: e.target.value })}
            />
          </form>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/[0.12] p-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </section>

        <CardForm onChange={setCardData} disabled={loading} />
      </div>

      <aside className="h-fit rounded-xl border border-white/[0.12] bg-[#080d17]/95 p-5 backdrop-blur-xl sm:p-6 lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rio-cyan">Resumen</p>
        <div className="mt-4 grid gap-2">
          {selectedItems.map(({ ticketType, quantity }) => (
            <div
              key={ticketType.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3"
            >
              <div>
                <p className="font-semibold">{ticketType.name}</p>
                <p className="text-sm text-white/[0.48]">
                  {quantity} x {formatMoney(ticketType.price, ticketType.currency)}
                </p>
              </div>
              <p className="font-bold">{formatMoney(ticketType.price * quantity, ticketType.currency)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/60">
            {totalQuantity === 1 ? "1 entrada" : `${totalQuantity} entradas`}
          </span>
          <span className="text-2xl font-black">{formatMoney(total, currency)}</span>
        </div>

        <Button
          type="submit"
          form="checkout-form"
          disabled={loading}
          className="mt-5 w-full min-h-12 text-base"
        >
          <CreditCard className="size-4" />
          {loading ? "Procesando pago..." : "Comprar"}
        </Button>

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-white/[0.45]">
          <ShieldCheck className="size-4 text-rio-cyan" />
          Pago seguro por Mercado Pago.
        </div>
      </aside>
    </div>
  );
}
