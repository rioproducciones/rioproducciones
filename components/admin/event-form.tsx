"use client";

import { type ReactNode, useState } from "react";
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
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue) - 1;
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const date = new Date(year, month, day, hour, minute);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date.toISOString();
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

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 ${className || ""}`}>
      <span className="text-sm font-semibold text-white/70">{label}</span>
      {children}
    </label>
  );
}

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

    const eventDate = toIsoDateTime(event.event_date);

    if (!eventDate) {
      setError("Ingresá una fecha y hora válidas para el evento.");
      setLoading(false);
      return;
    }

    const payload = {
      ...event,
      slug: event.slug || slugify(event.name),
      event_date: eventDate,
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
          <Field label="Nombre del evento">
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
          </Field>
          <Field label="Slug de la URL">
            <Input
              required
              placeholder="slug-del-evento"
              value={event.slug}
              onChange={(inputEvent) => setEvent({ ...event, slug: inputEvent.target.value })}
            />
          </Field>
          <Field label="Fecha y hora">
            <Input
              required
              type="datetime-local"
              value={event.event_date}
              onChange={(inputEvent) => setEvent({ ...event, event_date: inputEvent.target.value })}
            />
          </Field>
          <Field label="Lugar">
            <Input
              placeholder="Lugar"
              value={event.location}
              onChange={(inputEvent) => setEvent({ ...event, location: inputEvent.target.value })}
            />
          </Field>
          <Field label="Imagen de portada" className="sm:col-span-2">
            <Input
              placeholder="URL de imagen"
              value={event.cover_image_url}
              onChange={(inputEvent) => setEvent({ ...event, cover_image_url: inputEvent.target.value })}
            />
          </Field>
          <Field label="Estado">
            <Select
              value={event.status}
              onChange={(inputEvent) =>
                setEvent({ ...event, status: inputEvent.target.value as EventPayload["status"] })
              }
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </Select>
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <Textarea
              placeholder="Descripción"
              value={event.description}
              onChange={(inputEvent) => setEvent({ ...event, description: inputEvent.target.value })}
            />
          </Field>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                <Field label="Nombre de la entrada">
                  <Input
                    placeholder="Nombre"
                    value={ticketType.name}
                    onChange={(inputEvent) => updateTicketType(index, { name: inputEvent.target.value })}
                  />
                </Field>
                <Field label="Precio (UYU)">
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={ticketType.price}
                    onChange={(inputEvent) => updateTicketType(index, { price: Number(inputEvent.target.value) })}
                  />
                </Field>
                <Field label="Stock disponible">
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={ticketType.stock}
                    onChange={(inputEvent) => updateTicketType(index, { stock: Number(inputEvent.target.value) })}
                  />
                </Field>
                <Field label="Máximo por compra">
                  <Input
                    type="number"
                    placeholder="Máx."
                    value={ticketType.max_per_order}
                    onChange={(inputEvent) =>
                      updateTicketType(index, { max_per_order: Number(inputEvent.target.value) })
                    }
                  />
                </Field>
                <Button
                  variant="ghost"
                  className="mt-auto px-0"
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
                <Field label="Descripción de la entrada" className="sm:col-span-2 lg:col-span-5">
                  <Input
                    placeholder="Descripción"
                    value={ticketType.description}
                    onChange={(inputEvent) =>
                      updateTicketType(index, { description: inputEvent.target.value })
                    }
                  />
                </Field>
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
