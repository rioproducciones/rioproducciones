import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPhoneTail } from "@/lib/utils";

type TicketSearchRow = {
  id: string;
  event_id: string;
  qr_token: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string | null;
  status: string;
  used_at: string | null;
  events?: { name?: string } | { name?: string }[] | null;
  ticket_types?: { name?: string } | { name?: string }[] | null;
};

const schema = z.object({
  q: z.string().trim().min(2).max(120),
  event_id: z.string().uuid().optional().nullable()
});

export async function GET(request: Request) {
  const auth = await requireApiRole(["owner", "admin", "staff"]);

  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const parsed = schema.safeParse({
    q: url.searchParams.get("q"),
    event_id: url.searchParams.get("event_id")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Búsqueda inválida" }, { status: 400 });
  }

  const query = parsed.data.q.replace(/[%_]/g, "");
  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("tickets")
    .select(
      `
      id,
      event_id,
      qr_token,
      buyer_name,
      buyer_lastname,
      buyer_email,
      buyer_phone,
      buyer_document,
      status,
      used_at,
      events ( name ),
      ticket_types ( name )
    `
    )
    .or(
      `buyer_name.ilike.%${query}%,buyer_lastname.ilike.%${query}%,buyer_email.ilike.%${query}%,buyer_phone.ilike.%${query}%,buyer_document.ilike.%${query}%,qr_token.ilike.%${query}%`
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (parsed.data.event_id) {
    builder = builder.eq("event_id", parsed.data.event_id);
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tickets:
      (data as TicketSearchRow[] | null)?.map((ticket) => {
        const eventData = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
        const ticketTypeData = Array.isArray(ticket.ticket_types)
          ? ticket.ticket_types[0]
          : ticket.ticket_types;

        return {
        id: ticket.id,
        event_id: ticket.event_id,
        token: ticket.qr_token,
        buyer_name: ticket.buyer_name,
        buyer_lastname: ticket.buyer_lastname,
        buyer_email: ticket.buyer_email,
        phone_tail: getPhoneTail(ticket.buyer_phone),
        buyer_document: ticket.buyer_document,
        status: ticket.status,
        used_at: ticket.used_at,
          event_name: eventData?.name,
          ticket_type_name: ticketTypeData?.name
        };
      }) || []
  });
}
