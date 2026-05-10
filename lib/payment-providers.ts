import type { PaymentProvider } from "@/lib/types";

export const paymentProviders: PaymentProvider[] = [
  "mercadopago",
  "paypal",
  "apple_pay",
  "crypto"
];

export const activePaymentProvider: PaymentProvider = "mercadopago";

export const applePayTodo = [
  "TODO: requiere Apple Developer Merchant ID.",
  "TODO: requiere dominio verificado.",
  "TODO: requiere HTTPS.",
  "TODO: requiere merchant validation server-side.",
  "TODO: requiere procesador compatible para procesar el token de Apple Pay."
];

export const cryptoTodo = "TODO: futura integración Web3 wallet / USDT.";
