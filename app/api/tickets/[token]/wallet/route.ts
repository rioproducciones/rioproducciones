import { NextResponse } from "next/server";
import { getTicketByToken } from "@/lib/public-data";
import { buildTicketWalletPass, type WalletPassTicket } from "@/lib/wallet-pass";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const ticket = await getTicketByToken(token);

  if (!ticket) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  try {
    const pass = await buildTicketWalletPass(ticket as WalletPassTicket);

    return new NextResponse(new Uint8Array(pass.buffer), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${pass.filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos generar el pkpass.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
