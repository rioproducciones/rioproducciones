"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { slugify } from "@/lib/utils";

type EventPayload = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  cover_image_url: string;
  status: "draft" | "published" | "archived";
  ticket_types: TicketTypePayload[];
};

type TicketTypePayload = {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  max_per_order: number;
  is_active: boolean;
};

type InitialEvent = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  event_date?: string;
  location?: string | null;
  cover_image_url?: string | null;
  status?: "draft" | "published" | "archived";
  ticket_types?: Array<TicketTypePayload & { id?: string }>;
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const emptyTicketType: TicketTypePayload = {
  name: "",
  description: "",
  price: 0,
  currency: "UYU",
  stock: 100,
  max_per_order: 10,
  is_active: true
};

export function EventForm({ initialEvent }: { initialEvent?: InitialEvent }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventPayload>({
    id: initialEvent?.id,
    name: initialEvent?.name || "",
    slug: initialEvent?.slug || "",
    description: initialEvent?.description || "",
    event_date: toDateTimeLocal(initialEvent?.event_date),
    location: initialEvent?.location || "",
    cover_image_url: initialEvent?.cover_image_url || "",
    status: initialEvent?.status || "draft",
    ticket_types:
      initialEvent?.ticket_types?.map((ticketType) => ({
        id: ticketType.id,
        name: ticketType.name,
        description: ticketType.description || "",
        price: ticketType.price,
        currency: ticketType.currency,
        stock: ticketType.stock,
        max_per_order: ticketType.max_per_order,
        is_active: ticketType.is_active
      })) || [{ ...emptyTicketType, name: "General", price: 1200, stock: 300 }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTicketType(index: number, patch: Partial<TicketTypePayload>) {
    setEvent((current) => ({
      ...current,
      ticket_types: current.ticket_types.map((ticketType, currentIndex) =>
        currentIndex === index ? { ...ticketType, ...patch } : ticketType
      )
    }));
  }

  async function submit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...event,
      slug: event.slug || slugify(event.name),
      event_date: new Date(event.event_date).toISOString(),
      cover_image_url: event.cover_image_url || null,
      description: event.description || null,
      location: event.location || null,
      ticket_types: event.ticket_types.filter((ticketType) => ticketType.name.trim())
    };

    const response = await fetch(event.id ? `/api/admin/events/${event.id}` : "/api/admin/events", {
      method: event.id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "No se pudo guardar el evento.");
      setLoading(false);
      return;
    }

    router.push(`/admin/eventos/${result.event_id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h2 className="text-xl font-black">Evento</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            required
            placeholder="Nombre"
            value={event.name}
            onChange={(inputEvent) =>
              setEvent((current) => ({
                ...current,
                name: inputEvent.target.value,
                slug: current.slug || slugify(inputEvent.target.value)
              }))
            }
          />
          <Input
            required
            placeholder="slug-del-evento"
            value={event.slug}
            onChange={(inputEvent) => setEvent({ ...event, slug: inputEvent.target.value })}
          />
          <Input
            required
            type="datetime-local"
            value={event.event_date}
            onChange={(inputEvent) => setEvent({ ...event, event_date: inputEvent.target.value })}
          />
          <Input
            placeholder="Lugar"
            value={event.location}
            onChange={(inputEvent) => setEvent({ ...event, location: inputEvent.target.value })}
          />
          <Input
            className="sm:col-span-2"
            placeholder="URL de imagen"
            value={event.cover_image_url}
            onChange={(inputEvent) => setEvent({ ...event, cover_image_url: inputEvent.target.value })}
          />
          <Select
            value={event.status}
            onChange={(inputEvent) =>
              setEvent({ ...event, status: inputEvent.target.value as EventPayload["status"] })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          <Textarea
            className="sm:col-span-2"
            placeholder="Descripción"
            value={event.description}
            onChange={(inputEvent) => setEvent({ ...event, description: inputEvent.target.value })}
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Tipos de entrada</h2>
          <Button
            variant="secondary"
            onClick={() =>
              setEvent((current) => ({
                ...current,
                ticket_types: [...current.ticket_types, { ...emptyTicketType }]
              }))
            }
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {event.ticket_types.map((ticketType, index) => (
            <div key={ticketType.id || index} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <Input
                  className="lg:col-span-2"
                  placeholder="Nombre"
                  value={ticketType.name}
                  onChange={(inputEvent) => updateTicketType(index, { name: inputEvent.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={ticketType.price}
                  onChange={(inputEvent) => updateTicketType(index, { price: Number(inputEvent.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={ticketType.stock}
                  onChange={(inputEvent) => updateTicketType(index, { stock: Number(inputEvent.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Máx."
                  value={ticketType.max_per_order}
                  onChange={(inputEvent) => updateTicketType(index, { max_per_order: Number(inputEvent.target.value) })}
                />
                <Button
                  variant="ghost"
                  className="px-0"
                  onClick={() =>
                    setEvent((current) => ({
                      ...current,
                      ticket_types: current.ticket_types.filter((_, currentIndex) => currentIndex !== index)
                    }))
                  }
                  aria-label="Eliminar entrada"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Input
                  className="sm:col-span-2 lg:col-span-6"
                  placeholder="Descripción"
                  value={ticketType.description}
                  onChange={(inputEvent) =>
                    updateTicketType(index, { description: inputEvent.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/[0.12] p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full sm:w-fit">
        <Save className="size-4" />
        {loading ? "Guardando..." : "Guardar evento"}
      </Button>
    </form>
  );
}
