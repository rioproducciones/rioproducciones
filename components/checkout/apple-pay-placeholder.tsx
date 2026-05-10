import { Apple } from "lucide-react";

export function ApplePayPlaceholder() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-white/60">
      <div className="flex items-center gap-2 font-semibold text-white/75">
        <Apple className="size-5" />
        Apple Pay próximamente
      </div>
      <p className="mt-2 text-sm">
        La arquitectura ya soporta <span className="font-semibold">payment_provider = apple_pay</span>,
        pero el checkout queda desactivado para no bloquear el MVP.
      </p>
      {/* TODO: requiere Apple Developer Merchant ID. */}
      {/* TODO: requiere dominio verificado. */}
      {/* TODO: requiere HTTPS. */}
      {/* TODO: requiere merchant validation server-side. */}
      {/* TODO: requiere procesador compatible para procesar el token de Apple Pay. */}
    </div>
  );
}
