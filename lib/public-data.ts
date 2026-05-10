import "server-only";

import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getPublishedEvents() {
  if (!hasSupabaseEnv()) return [];

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select(
      `
      id,
      name,
      slug,
      description,
      event_date,
      location,
      cover_image_url,
      status,
      ticket_types (
        id,
        event_id,
        name,
        description,
        price,
        currency,
        stock,
        sold_count,
        max_per_order,
        sale_starts_at,
        sale_ends_at,
        created_at,
        is_active
      )
    `
    )
    .eq("status", "published")
    .order("event_date", { ascending: true });

  return data || [];
}

export async function getPublishedEventBySlug(slug: string) {
  if (!hasSupabaseEnv()) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select(
      `
      id,
      name,
      slug,
      description,
      event_date,
      location,
      cover_image_url,
      status,
      ticket_types (
        id,
        event_id,
        name,
        description,
        price,
        currency,
        stock,
        sold_count,
        max_per_order,
        is_active,
        sale_starts_at,
        sale_ends_at,
        created_at
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

export async function getOrderSummary(orderId: string) {
  if (!hasSupabaseEnv()) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_name,
      buyer_lastname,
      buyer_email,
      buyer_phone,
      total_amount,
      currency,
      payment_status,
      mercadopago_preference_id,
      events (
        id,
        name,
        slug,
        event_date,
        location
      ),
      order_items (
        id,
        quantity,
        unit_price,
        subtotal,
        ticket_types (
          id,
          name
        )
      ),
      tickets (
        id,
        qr_token,
        status,
        ticket_types (
          name
        )
      )
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  return data;
}

export async function getTicketByToken(token: string) {
  if (!hasSupabaseEnv()) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("tickets")
    .select(
      `
      id,
      event_id,
      qr_token,
      status,
      buyer_name,
      buyer_lastname,
      buyer_email,
      buyer_phone,
      buyer_document,
      used_at,
      created_at,
      events (
        name,
        event_date,
        location
      ),
      ticket_types (
        name
      )
    `
    )
    .eq("qr_token", token)
    .maybeSingle();

  return data;
}
