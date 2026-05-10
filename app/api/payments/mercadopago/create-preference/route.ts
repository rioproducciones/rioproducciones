import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBackUrls, createMercadoPagoPreference, getMercadoPagoNotificationUrl } from "@/lib/mercadopago";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type OrderItemRow = {
  id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ticket_types: {
    id: string;
    name: string;
    description: string | null;
  };
};

const schema = z.object({
  order_id: z.string().uuid()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      events ( id, name, slug ),
      order_items (
        id,
        quantity,
        unit_price,
        subtotal,
        ticket_types ( id, name, description )
      )
    `
    )
    .eq("id", parsed.data.order_id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.payment_provider !== "mercadopago") {
    return NextResponse.json({ error: "Proveedor de pago no soportado" }, { status: 400 });
  }

  if (order.payment_status !== "pending") {
    return NextResponse.json({ error: `La orden está ${order.payment_status}` }, { status: 409 });
  }

  const preference = await createMercadoPagoPreference({
    items: (order.order_items as OrderItemRow[]).map((item) => ({
      id: item.ticket_type_id,
      title: `${order.events.name} - ${item.ticket_types.name}`,
      description: item.ticket_types.description || "Entrada digital Rio Producciones",
      quantity: item.quantity,
      currency_id: order.currency,
      unit_price: item.unit_price
    })),
    payer: {
      name: order.buyer_name,
      surname: order.buyer_lastname,
      email: order.buyer_email,
      phone: {
        number: order.buyer_phone
      },
      identification: order.buyer_document
        ? {
            type: "CI",
            number: order.buyer_document
          }
        : undefined
    },
    back_urls: buildBackUrls(order.id),
    notification_url: getMercadoPagoNotificationUrl(),
    external_reference: order.external_reference,
    auto_return: "approved",
    statement_descriptor: "RIO PRODUCCIONES",
    metadata: {
      order_id: order.id,
      event_id: order.event_id
    }
  });

  if (!preference.id || !preference.init_point) {
    return NextResponse.json(
      { error: "Mercado Pago no devolvió una preferencia válida" },
      { status: 502 }
    );
  }

  await supabase
    .from("orders")
    .update({ mercadopago_preference_id: preference.id })
    .eq("id", order.id);

  return NextResponse.json({
    preference_id: preference.id,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point
  });
}
