import "server-only";

import { randomBytes, randomUUID } from "crypto";
import { getSiteUrl } from "@/lib/env";

export function generateQrToken() {
  return `rio_${randomUUID()}_${randomBytes(24).toString("base64url")}`;
}

export function getTicketUrl(token: string) {
  return `${getSiteUrl()}/ticket/${token}`;
}

export function getCheckUrl(token: string) {
  return `${getSiteUrl()}/check/${token}`;
}
