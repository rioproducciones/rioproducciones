import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getSiteUrl, requiredEnv } from "@/lib/env";

type PreferenceItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
};

export type MercadoPagoPreferenceBody = {
  items: PreferenceItem[];
  payer: {
    name: string;
    surname?: string | null;
    email: string;
    phone?: {
      number: string;
    };
    identification?: {
      type: string;
      number: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  external_reference: string;
  auto_return: "approved";
  statement_descriptor?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function getMercadoPagoClient() {
  return new MercadoPagoConfig({
    accessToken: requiredEnv("MERCADOPAGO_ACCESS_TOKEN")
  });
}

export async function createMercadoPagoPreference(body: MercadoPagoPreferenceBody) {
  const preference = new Preference(getMercadoPagoClient());
  return preference.create({ body: body as never });
}

export async function getMercadoPagoPayment(paymentId: string) {
  const payment = new Payment(getMercadoPagoClient());
  return payment.get({ id: paymentId });
}

export function buildBackUrls(orderId: string) {
  const siteUrl = getSiteUrl();

  return {
    success: `${siteUrl}/checkout/success?order_id=${orderId}`,
    failure: `${siteUrl}/checkout/failure?order_id=${orderId}`,
    pending: `${siteUrl}/checkout/pending?order_id=${orderId}`
  };
}

export function getMercadoPagoNotificationUrl() {
  return `${getSiteUrl()}/api/webhooks/mercadopago?source_news=webhooks`;
}

export function verifyMercadoPagoWebhookSignature({
  signatureHeader,
  requestId,
  dataId,
  secret
}: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret?: string;
}) {
  if (!secret) return true;
  if (!signatureHeader || !requestId || !dataId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  );

  const timestamp = parts.ts;
  const hash = parts.v1;

  if (!timestamp || !hash) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  } catch {
    return false;
  }
}
