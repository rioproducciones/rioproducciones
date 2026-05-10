import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency = "UYU") {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Montevideo"
  }).format(new Date(value));
}

export function getPhoneTail(phone?: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function extractQrToken(input: string) {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const markerIndex = parts.findIndex((part) => part === "ticket" || part === "check");
    return markerIndex >= 0 ? parts[markerIndex + 1] || "" : parts.at(-1) || trimmed;
  } catch {
    return trimmed.replace(/^.*\/(ticket|check)\//, "");
  }
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
