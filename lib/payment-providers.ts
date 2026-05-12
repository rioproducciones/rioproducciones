import type { PaymentProvider } from "@/lib/types";

export const paymentProviders: PaymentProvider[] = [
  "mercadopago",
  "paypal",
  "apple_pay",
  "crypto",
  "free"
];

export const activePaymentProvider: PaymentProvider = "mercadopago";

export function isFreeCheckoutEnabled() {
  return process.env.ENABLE_FREE_CHECKOUT === "true" || process.env.NODE_ENV !== "production";
}

export const applePayTodo = [
  "TODO: requiere Apple Developer Merchant ID.",
  "TODO: requiere dominio verificado.",
  "TODO: requiere HTTPS.",
  "TODO: requiere merchant validation server-side.",
  "TODO: requiere procesador compatible para procesar el token de Apple Pay."
];

export const cryptoTodo = "TODO: futura integración Web3 wallet / USDT.";
