import { NextResponse } from "next/server";
import {
  getMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature
} from "@/lib/mercadopago";
import { approveOrderFromMercadoPagoPayment } from "@/lib/orders";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type MercadoPagoWebhookPayload = {
  id?: string | number;
  type?: string;
  topic?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

function getPaymentIdFromPayload(payload: MercadoPagoWebhookPayload, url: URL) {
  return (
    payload?.data?.id?.toString() ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    payload?.id?.toString() ||
    ""
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const payload = await request.json().catch(() => ({}));
  const paymentId = getPaymentIdFromPayload(payload, url);
  const eventType = payload?.type || payload?.topic || url.searchParams.get("topic") || "unknown";
  const supabase = getSupabaseAdminClient();

  const signatureOk = verifyMercadoPagoWebhookSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id") || paymentId,
    secret: process.env.MERCADOPAGO_WEBHOOK_SECRET
  });

  if (!signatureOk) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const { data: paymentEvent } = await supabase
    .from("payment_events")
    .insert({
      provider: "mercadopago",
      event_type: eventType,
      external_id: paymentId || null,
      payload
    })
    .select("id")
    .single();

  if (eventType !== "payment" && !payload?.action?.startsWith?.("payment")) {
    if (paymentEvent?.id) {
      await supabase.from("payment_events").update({ processed: true }).eq("id", paymentEvent.id);
    }

    return NextResponse.json({ received: true, ignored: true });
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Falta payment id" }, { status: 400 });
  }

  const payment = await getMercadoPagoPayment(paymentId);
  const result = await approveOrderFromMercadoPagoPayment(payment);

  if (paymentEvent?.id) {
    await supabase.from("payment_events").update({ processed: true }).eq("id", paymentEvent.id);
  }

  return NextResponse.json({ received: true, result });
}
