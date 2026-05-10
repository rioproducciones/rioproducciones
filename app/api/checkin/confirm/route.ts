import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { extractQrToken, getPhoneTail } from "@/lib/utils";

const schema = z.object({
  token: z.string().trim().min(8),
  event_id: z.string().uuid(),
  gate_name: z.string().trim().max(80).optional().nullable()
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["owner", "admin", "staff"]);

  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const token = extractQrToken(parsed.data.token);
  const { data, error } = await supabase.rpc("confirm_ticket_checkin", {
    p_token: token,
    p_event_id: parsed.data.event_id,
    p_staff_id: auth.context.user.id,
    p_gate_name: parsed.data.gate_name || null,
    p_device_info: request.headers.get("user-agent")
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data?.[0];

  if (!result) {
    return NextResponse.json({
      status: "invalid",
      message: "QR inválido",
      ticket: null
    });
  }

  return NextResponse.json({
    status: result.scan_result,
    message: result.scan_message,
    ticket: {
      id: result.ticket_id,
      event_id: result.event_id,
      event_name: result.event_name,
      ticket_type_name: result.ticket_type_name,
      buyer_name: result.buyer_name,
      buyer_lastname: result.buyer_lastname,
      buyer_email: result.buyer_email,
      phone_tail: getPhoneTail(result.buyer_phone),
      buyer_document: result.buyer_document,
      status: result.ticket_status,
      used_at: result.used_at
    }
  });
}
