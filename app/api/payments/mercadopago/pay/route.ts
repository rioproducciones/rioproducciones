import { NextResponse } from "next/server";
import { z } from "zod";
import { approveOrderFromMercadoPagoPayment } from "@/lib/orders";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requiredEnv } from "@/lib/env";

const paymentSchema = z.object({
  order_id: z.string().uuid(),
  card: z.object({
    number: z.string().regex(/^\d{16}$/),
    holder: z.object({
      name: z.string().min(3).max(50)
    }),
    expiration_month: z.string().regex(/^\d{2}$/),
    expiration_year: z.string().regex(/^\d{2}$/),
    security_code: z.string().regex(/^\d{3,4}$/)
  })
});

export async function POST(request: Request) {
  const parsed = paymentSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { order_id: orderId, card } = parsed.data;
  const supabase = getSupabaseAdminClient();

  // Obtener la orden
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, total_amount, currency, buyer_email, buyer_document, payment_status, external_reference")
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .eq("payment_provider", "mercadopago")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Orden no encontrada o ya fue pagada" },
      { status: 404 }
    );
  }

  try {
    const accessToken = requiredEnv("MERCADOPAGO_ACCESS_TOKEN");

    // Crear pago usando API REST de Mercado Pago
    const paymentPayload = {
      transaction_amount: order.total_amount,
      description: "Entradas - Rio Producciones",
      payment_method_id: "credit_card",
      installments: 1,
      payer: {
        email: order.buyer_email,
        ...(order.buyer_document && {
          identification: {
            type: "CI",
            number: order.buyer_document
          }
        })
      },
      card: {
        number: card.number,
        cardholder: {
          name: card.holder.name
        },
        expiration_month: parseInt(card.expiration_month),
        expiration_year: parseInt(`20${card.expiration_year}`),
        security_code: card.security_code
      },
      statement_descriptor: "RIO PRODUCCIONES",
      external_reference: order.external_reference
    };

    console.log("Creating payment with Mercado Pago API...", {
      amount: order.total_amount,
      orderId
    });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await mpResponse.json();

    console.log("Mercado Pago API response:", {
      status: mpResponse.status,
      paymentStatus: paymentData.status,
      id: paymentData.id
    });

    if (!mpResponse.ok) {
      console.error("Mercado Pago API error:", paymentData);

      if (mpResponse.status === 401) {
        return NextResponse.json(
          { error: "Error de autenticación con Mercado Pago. Verifica tu Access Token." },
          { status: 500 }
        );
      }

      if (paymentData.error) {
        return NextResponse.json(
          {
            error: paymentData.message || "No pudimos procesar tu pago. Intenta nuevamente.",
            details: paymentData.cause?.[0]?.description
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: "Error al procesar el pago." },
        { status: mpResponse.status >= 500 ? 502 : 402 }
      );
    }

    // Procesar resultado del pago
    const approvalResult = await approveOrderFromMercadoPagoPayment({
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference
    });

    if (approvalResult.approved) {
      return NextResponse.json({
        order_id: approvalResult.orderId,
        status: "approved"
      });
    }

    // Si el pago fue rechazado
    if (paymentData.status === "rejected") {
      return NextResponse.json(
        {
          error: "El pago fue rechazado. Por favor verifica los datos de tu tarjeta.",
          status_detail: paymentData.status_detail
        },
        { status: 402 }
      );
    }

    if (paymentData.status === "pending") {
      return NextResponse.json(
        {
          error: "El pago está pendiente de procesamiento. Intenta nuevamente en unos momentos."
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "No pudimos procesar el pago. Intenta nuevamente." },
      { status: 402 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error procesando el pago";
    const stack = error instanceof Error ? error.stack : "";
    console.error("Payment error details:", {
      message,
      stack,
      orderId
    });

    return NextResponse.json(
      {
        error: "Hubo un error al procesar tu pago. Intenta nuevamente.",
        details: process.env.NODE_ENV === "development" ? message : undefined
      },
      { status: 500 }
    );
  }
}
