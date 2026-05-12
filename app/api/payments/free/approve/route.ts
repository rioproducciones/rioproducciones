import { NextResponse } from "next/server";
import { z } from "zod";
import { approveOrderForFreeCheckout } from "@/lib/orders";
import { isFreeCheckoutEnabled } from "@/lib/payment-providers";

const schema = z.object({
  order_id: z.string().uuid()
});

export async function POST(request: Request) {
  if (!isFreeCheckoutEnabled()) {
    return NextResponse.json(
      { error: "El modo gratis de prueba no está habilitado." },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }

  try {
    const result = await approveOrderForFreeCheckout(parsed.data.order_id);

    if (!result.approved) {
      return NextResponse.json(
        { error: `No se puede aprobar una orden en estado ${result.reason}` },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ...result,
      redirect_url: `/checkout/success?order_id=${parsed.data.order_id}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos aprobar la orden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
