import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PKPass, type PassProps } from "passkit-generator";
import { getTicketUrl } from "@/lib/tickets";

type WalletTicketEvent = {
  name: string;
  event_date: string;
  location: string | null;
};

type WalletTicketType = {
  name: string;
};

export type WalletPassTicket = {
  id: string;
  qr_token: string;
  status: string;
  buyer_name: string;
  buyer_lastname: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string | null;
  events: WalletTicketEvent | WalletTicketEvent[] | null;
  ticket_types: WalletTicketType | WalletTicketType[] | null;
};

type PasskitCertificateName = "WWDR_CERT" | "SIGNER_CERT" | "SIGNER_KEY";

function passkitEnv(name: string) {
  return process.env[`PASSKIT_${name}`];
}

function hasCertificate(name: PasskitCertificateName) {
  return Boolean(passkitEnv(name) || passkitEnv(`${name}_PATH`));
}

export function isWalletPassConfigured() {
  return Boolean(
    passkitEnv("PASS_TYPE_IDENTIFIER") &&
      passkitEnv("TEAM_IDENTIFIER") &&
      hasCertificate("WWDR_CERT") &&
      hasCertificate("SIGNER_CERT") &&
      hasCertificate("SIGNER_KEY")
  );
}

async function readCertificate(name: PasskitCertificateName) {
  const inlineValue = passkitEnv(name);

  if (inlineValue) {
    const normalizedValue = inlineValue.replace(/\\n/g, "\n");

    if (normalizedValue.startsWith("base64:")) {
      return Buffer.from(normalizedValue.slice("base64:".length), "base64");
    }

    return Buffer.from(normalizedValue);
  }

  const certificatePath = passkitEnv(`${name}_PATH`);

  if (!certificatePath) {
    throw new Error(`Falta PASSKIT_${name} o PASSKIT_${name}_PATH`);
  }

  return readFile(certificatePath);
}

async function getPasskitCertificates() {
  const signerKeyPassphrase = passkitEnv("SIGNER_KEY_PASSPHRASE");

  return {
    wwdr: await readCertificate("WWDR_CERT"),
    signerCert: await readCertificate("SIGNER_CERT"),
    signerKey: await readCertificate("SIGNER_KEY"),
    ...(signerKeyPassphrase ? { signerKeyPassphrase } : {})
  };
}

function firstItem<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value;
}

function getPassDateFields(eventDate?: string) {
  if (!eventDate) return {};

  const date = new Date(eventDate);

  if (Number.isNaN(date.getTime())) return {};

  const expirationDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  return {
    relevantDate: date.toISOString(),
    expirationDate: expirationDate.toISOString()
  };
}

function getNormalizedEventDate(eventDate?: string) {
  if (!eventDate) return null;

  const date = new Date(eventDate);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getPassFilename(ticket: WalletPassTicket) {
  return `rio-${ticket.qr_token.slice(-12).toLowerCase()}.pkpass`;
}

export async function buildTicketWalletPass(ticket: WalletPassTicket) {
  if (!isWalletPassConfigured()) {
    throw new Error("Apple Wallet no está configurado para generar pkpass.");
  }

  const event = firstItem(ticket.events);
  const ticketType = firstItem(ticket.ticket_types);
  const eventName = event?.name || "Entrada Rio";
  const ticketName = ticketType?.name || "Entrada";
  const ticketUrl = getTicketUrl(ticket.qr_token);
  const normalizedEventDate = getNormalizedEventDate(event?.event_date);
  const [icon, icon2x, icon3x, logo, logo2x, logo3x] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "wallet", "icon.png")),
    readFile(path.join(process.cwd(), "public", "wallet", "icon@2x.png")),
    readFile(path.join(process.cwd(), "public", "wallet", "icon@3x.png")),
    readFile(path.join(process.cwd(), "public", "wallet", "logo.png")),
    readFile(path.join(process.cwd(), "public", "wallet", "logo@2x.png")),
    readFile(path.join(process.cwd(), "public", "wallet", "logo@3x.png"))
  ]);
  const certificates = await getPasskitCertificates();
  const passProps: PassProps = {
    formatVersion: 1,
    passTypeIdentifier: passkitEnv("PASS_TYPE_IDENTIFIER"),
    teamIdentifier: passkitEnv("TEAM_IDENTIFIER"),
    organizationName: passkitEnv("ORGANIZATION_NAME") || "Rio Producciones",
    description: `${eventName} - ${ticketName}`,
    serialNumber: ticket.id,
    logoText: "Rio Producciones",
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: "rgb(8,13,23)",
    labelColor: "rgb(89,231,255)",
    voided: ticket.status !== "valid",
    userInfo: {
      ticketId: ticket.id,
      qrToken: ticket.qr_token
    },
    ...getPassDateFields(event?.event_date),
    eventTicket: {
      headerFields: [],
      primaryFields: [
        {
          key: "event",
          label: "Evento",
          value: eventName
        }
      ],
      secondaryFields: [
        {
          key: "ticket",
          label: "Entrada",
          value: ticketName
        }
      ],
      auxiliaryFields: [
        ...(normalizedEventDate
          ? [
              {
                key: "date",
                label: "Fecha",
                value: normalizedEventDate,
                dateStyle: "PKDateStyleMedium" as const,
                timeStyle: "PKDateStyleShort" as const
              }
            ]
          : []),
        {
          key: "location",
          label: "Lugar",
          value: event?.location || "Rio Producciones"
        }
      ],
      backFields: [
        {
          key: "buyer",
          label: "Comprador",
          value: `${ticket.buyer_name} ${ticket.buyer_lastname || ""}`.trim()
        },
        {
          key: "email",
          label: "Email",
          value: ticket.buyer_email
        },
        {
          key: "document",
          label: "Documento",
          value: ticket.buyer_document || "-"
        },
        {
          key: "status",
          label: "Estado",
          value: ticket.status
        },
        {
          key: "url",
          label: "Entrada online",
          value: ticketUrl
        }
      ],
      additionalInfoFields: []
    }
  };

  const pass = new PKPass(
    {
      "icon.png": icon,
      "icon@2x.png": icon2x,
      "icon@3x.png": icon3x,
      "logo.png": logo,
      "logo@2x.png": logo2x,
      "logo@3x.png": logo3x,
      "pass.json": Buffer.from(JSON.stringify(passProps))
    },
    certificates
  );

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: ticketUrl,
    messageEncoding: "iso-8859-1",
    altText: ticket.qr_token.slice(-12).toUpperCase()
  });

  return {
    filename: getPassFilename(ticket),
    buffer: pass.getAsBuffer()
  };
}
