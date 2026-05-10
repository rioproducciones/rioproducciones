import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { activePaymentProvider } from "@/lib/payment-providers";

const createOrderSchema = z.object({
  event_id: z.string().uuid(),
  buyer_name: z.string().trim().min(2).max(80),
  buyer_lastname: z.string().trim().max(80).optional().nullable(),
  buyer_email: z.string().trim().email().max(160),
  buyer_phone: z.string().trim().min(6).max(40),
  buyer_document: z.string().trim().max(40).optional().nullable(),
  payment_provider: z
    .enum(["mercadopago", "paypal", "apple_pay", "crypto"])
    .default(activePaymentProvider),
  items: z
    .array(
      z.object({
        ticket_type_id: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(10)
});

export async function POST(request: Request) {
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  if (payload.payment_provider !== "mercadopago") {
    return NextResponse.json(
      { error: "Proveedor de pago todavía no disponible para el MVP" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", payload.event_id)
    .eq("status", "published")
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Evento no disponible" }, { status: 404 });
  }

  const requestedIds = payload.items.map((item) => item.ticket_type_id);
  const { data: ticketTypes, error: ticketTypesError } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", payload.event_id)
    .in("id", requestedIds)
    .eq("is_active", true);

  if (ticketTypesError) {
    return NextResponse.json({ error: ticketTypesError.message }, { status: 500 });
  }

  const ticketTypeById = new Map(ticketTypes?.map((ticketType) => [ticketType.id, ticketType]));
  const now = Date.now();

  let totalAmount = 0;
  const items = payload.items.map((item) => {
    const ticketType = ticketTypeById.get(item.ticket_type_id);

    if (!ticketType) {
      throw new Error("Tipo de entrada no disponible");
    }

    if (item.quantity > ticketType.max_per_order) {
      throw new Error(`Máximo ${ticketType.max_per_order} para ${ticketType.name}`);
    }

    const startsAt = ticketType.sale_starts_at ? new Date(ticketType.sale_starts_at).getTime() : null;
    const endsAt = ticketType.sale_ends_at ? new Date(ticketType.sale_ends_at).getTime() : null;

    if ((startsAt && now < startsAt) || (endsAt && now > endsAt)) {
      throw new Error(`La venta de ${ticketType.name} no está habilitada`);
    }

    const available = ticketType.stock - ticketType.sold_count;

    if (item.quantity > available) {
      throw new Error(`No hay stock suficiente para ${ticketType.name}`);
    }

    const subtotal = ticketType.price * item.quantity;
    totalAmount += subtotal;

    return {
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      unit_price: ticketType.price,
      subtotal
    };
  });

  const externalReference = `rio_${crypto.randomUUID()}`;

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        event_id: payload.event_id,
        buyer_name: payload.buyer_name,
        buyer_lastname: payload.buyer_lastname || null,
        buyer_email: payload.buyer_email.toLowerCase(),
        buyer_phone: payload.buyer_phone,
        buyer_document: payload.buyer_document || null,
        total_amount: totalAmount,
        currency: "UYU",
        payment_provider: "mercadopago",
        payment_status: "pending",
        external_reference: externalReference
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || "No se pudo crear la orden");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        ...item
      }))
    );

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    return NextResponse.json({ order_id: order.id, checkout_url: `/checkout/${order.id}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la orden";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
