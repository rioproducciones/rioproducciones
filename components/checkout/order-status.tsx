"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/utils";

type OrderStatusResponse = {
  order: {
    id: string;
    payment_status: string;
    total_amount: number;
    currency: string;
    buyer_email: string;
    event: { name: string; slug: string } | null;
    tickets: Array<{
      id: string;
      qr_token: string;
      status: string;
      ticket_types: { name: string } | null;
    }>;
  };
};

export function OrderStatus({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
    if (response.ok) {
      setData(await response.json());
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  const order = data?.order;
  const isApproved = order?.payment_status === "approved";
  const hasTickets = Boolean(order?.tickets?.length);

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">Orden</p>
          <h1 className="mt-1 text-2xl font-black">Estado de compra</h1>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading} className="size-11 px-0">
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      {!order ? (
        <p className="mt-6 text-white/60">Cargando orden...</p>
      ) : (
        <div className="mt-5 grid gap-4">
          <div className="rounded-lg border border-white/10 bg-black/[0.24] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{order.event?.name || "Evento"}</p>
                <p className="text-sm text-white/50">{formatMoney(order.total_amount, order.currency)}</p>
              </div>
              <StatusBadge tone={isApproved ? "green" : "yellow"}>
                {isApproved ? "Aprobada" : "Confirmando"}
              </StatusBadge>
            </div>
          </div>

          {isApproved && hasTickets ? (
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-white/70">Tus entradas</p>
              {order.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/ticket/${ticket.qr_token}`}
                  className="flex min-h-12 items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Ticket className="size-4 text-rio-cyan" />
                    {ticket.ticket_types?.name || "Entrada"}
                  </span>
                  <span className="text-sm text-white/[0.48]">Ver QR</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-300/25 bg-yellow-300/[0.1] p-4 text-sm text-yellow-50">
              Estamos confirmando tu pago. Si Mercado Pago ya aprobó la operación, el webhook generará
              tus QR en unos segundos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
