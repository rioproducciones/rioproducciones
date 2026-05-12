import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateQrToken } from "@/lib/tickets";

type MercadoPagoPaymentLike = {
  id?: number | string;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number;
};

type ApprovedOrderItem = {
  id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ticket_types?: {
    id: string;
    event_id: string;
    name: string;
  } | null;
};

type ApprovedOrder = {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string | null;
  payment_status: string;
  order_items: ApprovedOrderItem[];
};

export async function generateTicketsForApprovedOrder(orderId: string) {
  const supabase = getSupabaseAdminClient();

  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if (count && count > 0) {
    return { created: 0 };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        ticket_type_id,
        quantity,
        unit_price,
        subtotal,
        ticket_types (
          id,
          event_id,
          name
        )
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Orden no encontrada");
  }

  if (order.payment_status !== "approved") {
    throw new Error("La orden no está aprobada");
  }

  const approvedOrder = order as ApprovedOrder;

  const tickets = approvedOrder.order_items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      event_id: approvedOrder.event_id,
      order_id: approvedOrder.id,
      ticket_type_id: item.ticket_type_id,
      buyer_name: approvedOrder.buyer_name,
      buyer_lastname: approvedOrder.buyer_lastname,
      buyer_email: approvedOrder.buyer_email,
      buyer_phone: approvedOrder.buyer_phone,
      buyer_document: approvedOrder.buyer_document,
      qr_token: generateQrToken(),
      status: "valid"
    }))
  );

  if (tickets.length === 0) {
    return { created: 0 };
  }

  const { error: ticketError } = await supabase.from("tickets").insert(tickets);

  if (ticketError) {
    throw new Error(ticketError.message);
  }

  await Promise.all(
    approvedOrder.order_items.map((item) =>
      supabase.rpc("increment_ticket_type_sold_count", {
        p_ticket_type_id: item.ticket_type_id,
        p_quantity: item.quantity
      })
    )
  );

  return { created: tickets.length };
}

export async function approveOrderForFreeCheckout(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const approvedAt = new Date().toISOString();

  const approvePendingOrder = (values: {
    payment_provider?: string;
    payment_status: string;
    approved_at: string;
  }) =>
    supabase
      .from("orders")
      .update(values)
      .eq("id", orderId)
      .eq("payment_status", "pending")
      .in("payment_provider", ["mercadopago", "free"])
      .select("id")
      .maybeSingle();

  let { data: updatedOrder, error: updateError } = await approvePendingOrder({
    payment_provider: "free",
    payment_status: "approved",
    approved_at: approvedAt
  });

  if (updateError) {
    const fallback = await approvePendingOrder({
      payment_status: "approved",
      approved_at: approvedAt
    });

    updatedOrder = fallback.data;
    updateError = fallback.error;
  }

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (updatedOrder?.id) {
    await supabase.from("payment_events").insert({
      provider: "free",
      event_type: "free_checkout_approved",
      external_id: updatedOrder.id,
      payload: { order_id: updatedOrder.id },
      processed: true
    });

    await generateTicketsForApprovedOrder(updatedOrder.id);
    return { approved: true, orderId: updatedOrder.id };
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (existingError || !existingOrder) {
    throw new Error(existingError?.message || "Orden no encontrada");
  }

  if (existingOrder.payment_status === "approved") {
    await generateTicketsForApprovedOrder(existingOrder.id);
    return { approved: true, orderId: existingOrder.id, alreadyApproved: true };
  }

  return { approved: false, orderId: existingOrder.id, reason: existingOrder.payment_status };
}

export async function approveOrderFromMercadoPagoPayment(payment: MercadoPagoPaymentLike) {
  if (payment.status !== "approved") {
    return { approved: false, reason: `payment_${payment.status || "unknown"}` };
  }

  if (!payment.external_reference) {
    throw new Error("El pago aprobado no tiene external_reference");
  }

  const supabase = getSupabaseAdminClient();
  const paymentId = payment.id ? String(payment.id) : null;

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "approved",
      mercadopago_payment_id: paymentId,
      approved_at: new Date().toISOString()
    })
    .eq("external_reference", payment.external_reference)
    .eq("payment_provider", "mercadopago")
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (updatedOrder?.id) {
    await generateTicketsForApprovedOrder(updatedOrder.id);
    return { approved: true, orderId: updatedOrder.id };
  }

  const { data: existingOrder, error: existingError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("external_reference", payment.external_reference)
    .maybeSingle();

  if (existingError || !existingOrder) {
    throw new Error(existingError?.message || "Orden no encontrada para external_reference");
  }

  if (existingOrder.payment_status === "approved") {
    await generateTicketsForApprovedOrder(existingOrder.id);
    return { approved: true, orderId: existingOrder.id, alreadyApproved: true };
  }

  return { approved: false, orderId: existingOrder.id, reason: existingOrder.payment_status };
}
