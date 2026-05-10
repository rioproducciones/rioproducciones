"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

type Buyer = {
  buyer_name: string;
  buyer_lastname: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string;
};

export function EventPurchaseForm({
  eventId,
  ticketTypes
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState<Buyer>({
    buyer_name: "",
    buyer_lastname: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_document: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedItems = useMemo(
    () =>
      ticketTypes
        .map((ticketType) => ({
          ticketType,
          quantity: quantities[ticketType.id] || 0
        }))
        .filter((item) => item.quantity > 0),
    [quantities, ticketTypes]
  );

  const total = selectedItems.reduce(
    (sum, item) => sum + item.ticketType.price * item.quantity,
    0
  );

  function setQuantity(ticketType: TicketType, nextQuantity: number) {
    const available = Math.max(ticketType.stock - ticketType.sold_count, 0);
    const capped = Math.max(0, Math.min(nextQuantity, ticketType.max_per_order, available));
    setQuantities((current) => ({
      ...current,
      [ticketType.id]: capped
    }));
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selectedItems.length === 0) {
      setError("Seleccioná al menos una entrada.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(result.error || "No pudimos crear la orden.");
      return;
    }

    router.push(result.checkout_url);
  }

  return (
    <form onSubmit={submitOrder} className="glass-panel rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-rio-cyan">
        <ShieldCheck className="size-4" />
        Compra segura con QR único
      </div>

      <div className="mt-4 grid gap-3">
        {ticketTypes.map((ticketType) => {
          const available = Math.max(ticketType.stock - ticketType.sold_count, 0);
          const quantity = quantities[ticketType.id] || 0;

          return (
            <div
              key={ticketType.id}
              className="rounded-lg border border-white/10 bg-black/[0.22] p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{ticketType.name}</h3>
                  <p className="mt-1 text-sm text-white/[0.52]">{ticketType.description}</p>
                  <p className="mt-2 text-sm text-white/[0.48]">
                    {available > 0 ? `${available} disponibles` : "Agotada"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rio-cyan">
                    {formatMoney(ticketType.price, ticketType.currency)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="secondary"
                  className="size-11 px-0"
                  disabled={quantity === 0}
                  onClick={() => setQuantity(ticketType, quantity - 1)}
                  aria-label={`Restar ${ticketType.name}`}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-12 text-center text-lg font-bold">{quantity}</span>
                <Button
                  variant="secondary"
                  className="size-11 px-0"
                  disabled={available === 0 || quantity >= ticketType.max_per_order}
                  onClick={() => setQuantity(ticketType, quantity + 1)}
                  aria-label={`Sumar ${ticketType.name}`}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input
          required
          placeholder="Nombre"
          value={buyer.buyer_name}
          onChange={(event) => setBuyer({ ...buyer, buyer_name: event.target.value })}
        />
        <Input
          placeholder="Apellido"
          value={buyer.buyer_lastname}
          onChange={(event) => setBuyer({ ...buyer, buyer_lastname: event.target.value })}
        />
        <Input
          required
          type="email"
          placeholder="Email"
          value={buyer.buyer_email}
          onChange={(event) => setBuyer({ ...buyer, buyer_email: event.target.value })}
        />
        <Input
          required
          placeholder="Teléfono"
          value={buyer.buyer_phone}
          onChange={(event) => setBuyer({ ...buyer, buyer_phone: event.target.value })}
        />
        <Input
          className="sm:col-span-2"
          placeholder="Documento / CI opcional"
          value={buyer.buyer_document}
          onChange={(event) => setBuyer({ ...buyer, buyer_document: event.target.value })}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/[0.12] p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-xs uppercase text-white/40">Total</p>
          <p className="text-xl font-black">{formatMoney(total)}</p>
        </div>
        <Button type="submit" disabled={loading || total === 0} className="min-w-36">
          <CreditCard className="size-4" />
          {loading ? "Creando..." : "Continuar"}
        </Button>
      </div>
    </form>
  );
}
