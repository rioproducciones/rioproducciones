import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const paramsSchema = z.object({
  id: z.string().uuid()
});

const ticketTypeSchema = z.object({
  id: z.string().uuid().optional(),
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
  slug: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000).optional().nullable(),
  event_date: z.string().datetime(),
  location: z.string().trim().max(200).optional().nullable(),
  cover_image_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  ticket_types: z.array(ticketTypeSchema).optional().default([])
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole(["owner", "admin"]);

  if (!auth.ok) return auth.response;

  const params = paramsSchema.safeParse(await context.params);
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));

  if (!params.success || !parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const payload = parsed.data;
  const { error } = await supabase
    .from("events")
    .update({
      name: payload.name,
      slug: slugify(payload.slug),
      description: payload.description || null,
      event_date: payload.event_date,
      location: payload.location || null,
      cover_image_url: payload.cover_image_url || null,
      status: payload.status
    })
    .eq("id", params.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  for (const ticketType of payload.ticket_types) {
    if (ticketType.id) {
      await supabase
        .from("ticket_types")
        .update({
          name: ticketType.name,
          description: ticketType.description || null,
          price: ticketType.price,
          currency: ticketType.currency,
          stock: ticketType.stock,
          max_per_order: ticketType.max_per_order,
          is_active: ticketType.is_active
        })
        .eq("id", ticketType.id)
        .eq("event_id", params.data.id);
    } else {
      await supabase.from("ticket_types").insert({
        ...ticketType,
        event_id: params.data.id
      });
    }
  }

  return NextResponse.json({ event_id: params.data.id });
}
