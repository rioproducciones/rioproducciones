"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

type EventOption = {
  id: string;
  name: string;
};

type TicketSearchResult = {
  id: string;
  event_id: string;
  token: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  phone_tail: string;
  buyer_document: string | null;
  status: string;
  used_at: string | null;
  event_name: string;
  ticket_type_name: string;
};

export function ManualSearch({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<TicketSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;

    setLoading(true);
    const params = new URLSearchParams({ q: query });

    if (eventId) {
      params.set("event_id", eventId);
    }

    const response = await fetch(`/api/admin/search-tickets?${params.toString()}`);
    const payload = await response.json();
    setTickets(payload.tickets || []);
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Select value={eventId} onChange={(event) => setEventId(event.target.value)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Nombre, email, teléfono, documento o token"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") search();
            }}
          />
          <Button onClick={search} disabled={loading || query.length < 2}>
            <Search className="size-4" />
            Buscar
          </Button>
        </div>
      </section>
      <section className="grid gap-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold">
                  {ticket.buyer_name} {ticket.buyer_lastname}
                </p>
                <p className="text-sm text-white/[0.55]">{ticket.buyer_email}</p>
                <p className="mt-1 text-sm text-white/[0.55]">
                  {ticket.event_name} · {ticket.ticket_type_name} · Tel. {ticket.phone_tail}
                </p>
                {ticket.used_at ? (
                  <p className="mt-1 text-sm text-red-100">Usada {formatDateTime(ticket.used_at)}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={ticket.status === "valid" ? "green" : ticket.status === "used" ? "red" : "yellow"}>
                  {ticket.status}
                </StatusBadge>
                <Link
                  href={`/ticket/${ticket.token}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-sm font-semibold hover:bg-white/10"
                >
                  Ver QR
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
