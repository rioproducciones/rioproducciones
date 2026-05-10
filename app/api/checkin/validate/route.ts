import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { extractQrToken, getPhoneTail } from "@/lib/utils";

type JoinedTicket = {
  id: string;
  event_id: string;
  order_id: string;
  ticket_type_id: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string | null;
  status: string;
  used_at: string | null;
  used_by: string | null;
  blocked_reason: string | null;
  events?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
  ticket_types?: { id?: string; name?: string } | { id?: string; name?: string }[] | null;
  orders?: { payment_status?: string } | { payment_status?: string }[] | null;
};

const schema = z.object({
  token: z.string().trim().min(8),
  event_id: z.string().uuid().optional().nullable(),
  gate_name: z.string().trim().max(80).optional().nullable()
});

function disabledResult(status: string) {
  if (status === "used") return { status: "used", message: "Entrada ya utilizada" };
  if (["cancelled", "refunded", "blocked"].includes(status)) {
    return { status, message: "Entrada no habilitada" };
  }

  return { status: "invalid", message: "Entrada no habilitada" };
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["owner", "admin", "staff"]);

  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const token = extractQrToken(parsed.data.token);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      event_id,
      order_id,
      ticket_type_id,
      buyer_name,
      buyer_lastname,
      buyer_email,
      buyer_phone,
      buyer_document,
      status,
      used_at,
      used_by,
      blocked_reason,
      events ( id, name ),
      ticket_types ( id, name ),
      orders ( payment_status )
    `
    )
    .eq("qr_token", token)
    .maybeSingle();
  const ticket = data as JoinedTicket | null;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ticket) {
    if (parsed.data.event_id) {
      await supabase.from("checkins").insert({
        event_id: parsed.data.event_id,
        scanned_by: auth.context.user.id,
        scan_result: "invalid",
        scan_message: "QR inválido",
        gate_name: parsed.data.gate_name || null,
        device_info: request.headers.get("user-agent")
      });
    }

    return NextResponse.json({
      status: "invalid",
      message: "QR inválido",
      ticket: null
    });
  }

  let usedByName: string | null = null;

  if (ticket.used_by) {
    const { data: usedBy } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.used_by)
      .maybeSingle();

    usedByName = usedBy?.full_name || null;
  }

  const eventData = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
  const ticketTypeData = Array.isArray(ticket.ticket_types)
    ? ticket.ticket_types[0]
    : ticket.ticket_types;
  const orderData = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders;

  const safeTicket = {
    id: ticket.id,
    event_id: ticket.event_id,
    event_name: eventData?.name || "Evento",
    ticket_type_name: ticketTypeData?.name || "Entrada",
    buyer_name: ticket.buyer_name,
    buyer_lastname: ticket.buyer_lastname,
    buyer_email: ticket.buyer_email,
    phone_tail: getPhoneTail(ticket.buyer_phone),
    buyer_document: ticket.buyer_document,
    status: ticket.status,
    used_at: ticket.used_at,
    used_by_name: usedByName
  };

  if (parsed.data.event_id && ticket.event_id !== parsed.data.event_id) {
    await supabase.from("checkins").insert({
      ticket_id: ticket.id,
      event_id: parsed.data.event_id,
      scanned_by: auth.context.user.id,
      scan_result: "wrong_event",
      scan_message: "Entrada no válida para este evento",
      gate_name: parsed.data.gate_name || null,
      device_info: request.headers.get("user-agent")
    });

    return NextResponse.json({
      status: "wrong_event",
      message: "Entrada no válida para este evento",
      ticket: safeTicket
    });
  }

  if (orderData?.payment_status !== "approved") {
    return NextResponse.json({
      status: "invalid",
      message: "Pago no aprobado",
      ticket: safeTicket
    });
  }

  if (ticket.status !== "valid") {
    const result = disabledResult(ticket.status);

    await supabase.from("checkins").insert({
      ticket_id: ticket.id,
      event_id: parsed.data.event_id || ticket.event_id,
      scanned_by: auth.context.user.id,
      scan_result: result.status === "cancelled" ? "cancelled" : result.status === "refunded" ? "refunded" : result.status === "blocked" ? "blocked" : result.status === "used" ? "used" : "invalid",
      scan_message: result.message,
      gate_name: parsed.data.gate_name || null,
      device_info: request.headers.get("user-agent")
    });

    return NextResponse.json({
      ...result,
      ticket: safeTicket
    });
  }

  return NextResponse.json({
    status: "valid",
    message: "Entrada válida",
    ticket: safeTicket
  });
}
