import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const ticketTypeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(240).optional().nullable(),
  price: z.coerce.number().int().min(0),
  currency: z.string().trim().default("UYU"),
  stock: z.coerce.number().int().min(0),
  max_per_order: z.coerce.number().int().min(1).max(50).default(10),
  is_active: z.coerce.boolean().default(true)
});

const eventSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(3000).optional().nullable(),
  event_date: z.string().datetime(),
  location: z.string().trim().max(200).optional().nullable(),
  cover_image_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  ticket_types: z.array(ticketTypeSchema).optional().default([])
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["owner", "admin"]);

  if (!auth.ok) return auth.response;

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const supabase = getSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: payload.name,
      slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      description: payload.description || null,
      event_date: payload.event_date,
      location: payload.location || null,
      cover_image_url: payload.cover_image_url || null,
      status: payload.status
    })
    .select("id")
    .single();

  if (error || !event) {
    return NextResponse.json({ error: error?.message || "No se pudo crear el evento" }, { status: 400 });
  }

  if (payload.ticket_types.length > 0) {
    const { error: ticketTypesError } = await supabase.from("ticket_types").insert(
      payload.ticket_types.map((ticketType) => ({
        ...ticketType,
        event_id: event.id
      }))
    );

    if (ticketTypesError) {
      return NextResponse.json({ error: ticketTypesError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ event_id: event.id });
}
