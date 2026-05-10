import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const paramsSchema = z.object({
  orderId: z.string().uuid()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      payment_status,
      total_amount,
      currency,
      buyer_email,
      events ( name, slug ),
      tickets (
        id,
        qr_token,
        status,
        ticket_types ( name )
      )
    `
    )
    .eq("id", params.data.orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      payment_status: order.payment_status,
      total_amount: order.total_amount,
      currency: order.currency,
      buyer_email: order.buyer_email,
      event: order.events,
      tickets: order.tickets
    }
  });
}
