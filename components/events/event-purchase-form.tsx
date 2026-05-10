"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Minus, Plus } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

export function EventPurchaseForm({
  eventId,
  ticketTypes,
  eventName,
  eventLocation,
  eventDate,
  availableTickets
}: {
  eventId: string;
  ticketTypes: TicketType[];
  eventName?: string;
  eventLocation?: string | null;
  eventDate?: string;
  availableTickets?: number;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedItems = useMemo(
    () =>
      ticketTypes
        .map((tt) => ({ ticketType: tt, quantity: quantities[tt.id] || 0 }))
        .filter((item) => item.quantity > 0),
    [quantities, ticketTypes]
  );

  const total = selectedItems.reduce(
    (sum, item) => sum + item.ticketType.price * item.quantity,
    0
  );
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  function setQuantity(tt: TicketType, next: number) {
    const available = Math.max(tt.stock - tt.sold_count, 0);
    const capped = Math.max(0, Math.min(next, tt.max_per_order, available));
    setQuantities((prev) => ({ ...prev, [tt.id]: capped }));
  }

  function goToCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedItems.length === 0) {
      setError("Seleccioná al menos una entrada.");
      return;
    }
    const params = new URLSearchParams({ event_id: eventId });
    for (const item of selectedItems) {
      params.append("items", `${item.ticketType.id}:${item.quantity}`);
    }
    router.push(`/checkout?${params.toString()}`);
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("es-UY", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  return (
    <form onSubmit={goToCheckout} className="space-y-6">
      {/* Event meta strip */}
      {(eventName || eventLocation || formattedDate) && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
          {formattedDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-rio-yellow" />
              {formattedDate}
            </span>
          )}
          {eventLocation && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-white/30" />
              {eventLocation}
            </span>
          )}
          {availableTickets !== undefined && availableTickets > 0 && (
            <span className="ml-auto font-semibold text-white/40">
              {availableTickets} disponibles
            </span>
          )}
        </div>
      )}

      {/* Ticket cards */}
      {ticketTypes.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/40">
          No hay entradas activas para este evento.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ticketTypes.map((tt) => {
            const available = Math.max(tt.stock - tt.sold_count, 0);
            const qty = quantities[tt.id] || 0;
            const soldOut = available === 0;
            const selected = qty > 0;

            return (
              <div
                key={tt.id}
                className={cn(
                  "relative rounded-2xl border p-5 transition-all duration-150",
                  selected
                    ? "border-rio-cyan/40 bg-rio-cyan/[0.06] shadow-[0_0_0_1px_rgba(0,229,255,0.15)]"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]",
                  soldOut && "pointer-events-none opacity-40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{tt.name}</p>
                    {tt.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-white/[0.45]">
                        {tt.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-lg font-black tabular-nums",
                      selected ? "text-rio-cyan" : "text-white"
                    )}
                  >
                    {formatMoney(tt.price, tt.currency)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
                    {soldOut ? "Agotado" : `${available} disp.`}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={qty === 0}
                      onClick={() => setQuantity(tt, qty - 1)}
                      aria-label={`Restar ${tt.name}`}
                      className="flex size-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white disabled:opacity-30"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-5 text-center text-base font-black tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={soldOut || qty >= tt.max_per_order}
                      onClick={() => setQuantity(tt, qty + 1)}
                      aria-label={`Sumar ${tt.name}`}
                      className="flex size-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white disabled:opacity-30"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Total + CTA */}
      <div
        className={cn(
          "flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-200",
          totalQuantity > 0
            ? "border-rio-cyan/25 bg-rio-cyan/[0.06]"
            : "border-white/[0.08] bg-white/[0.03]"
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            {totalQuantity === 0
              ? "Seleccioná entradas"
              : totalQuantity === 1
                ? "1 entrada"
                : `${totalQuantity} entradas`}
          </p>
          {totalQuantity > 0 && (
            <p className="mt-0.5 text-2xl font-black">{formatMoney(total)}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={totalQuantity === 0}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold transition-all",
            totalQuantity > 0
              ? "bg-rio-cyan text-black shadow-glow hover:bg-cyan-200"
              : "bg-white/[0.06] text-white/30"
          )}
        >
          Continuar →
        </button>
      </div>
    </form>
  );
}
