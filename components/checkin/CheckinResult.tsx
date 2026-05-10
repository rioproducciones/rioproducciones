"use client";

import { CheckCircle2, CircleAlert, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

export type CheckinResultData = {
  status: string;
  message: string;
  ticket: null | {
    id: string;
    event_id: string;
    event_name: string;
    ticket_type_name: string;
    buyer_name: string;
    buyer_lastname: string | null;
    buyer_email?: string;
    phone_tail?: string;
    buyer_document: string | null;
    status: string;
    used_at: string | null;
    used_by_name?: string | null;
  };
};

function resultStyle(status: string) {
  if (status === "valid") {
    return {
      className: "border-green-400/30 bg-green-400/[0.12]",
      icon: CheckCircle2,
      tone: "green" as const
    };
  }

  if (status === "wrong_event") {
    return {
      className: "border-yellow-400/30 bg-yellow-400/[0.12]",
      icon: CircleAlert,
      tone: "yellow" as const
    };
  }

  return {
    className: "border-red-400/30 bg-red-400/[0.12]",
    icon: ShieldX,
    tone: "red" as const
  };
}

export function CheckinResult({
  result,
  onConfirm,
  confirming
}: {
  result: CheckinResultData | null;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  if (!result) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white/[0.55]">
        Esperando lectura de QR.
      </div>
    );
  }

  const style = resultStyle(result.status);
  const Icon = style.icon;
  const ticket = result.ticket;

  return (
    <div className={`rounded-xl border p-4 ${style.className}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-7" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{result.message}</h2>
            <StatusBadge tone={style.tone}>{result.status}</StatusBadge>
          </div>
          {ticket ? (
            <div className="mt-4 grid gap-2 text-sm">
              <p className="text-lg font-bold">
                {ticket.buyer_name} {ticket.buyer_lastname}
              </p>
              <p>{ticket.ticket_type_name}</p>
              <p>{ticket.event_name}</p>
              <p>Teléfono termina en {ticket.phone_tail || "----"}</p>
              {ticket.buyer_document ? <p>Documento: {ticket.buyer_document}</p> : null}
              {ticket.used_at ? (
                <p>
                  Usada: {formatDateTime(ticket.used_at)}
                  {ticket.used_by_name ? ` por ${ticket.used_by_name}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
          {result.status === "valid" ? (
            <Button className="mt-5 w-full" onClick={onConfirm} disabled={confirming}>
              {confirming ? "Confirmando..." : "Confirmar ingreso"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
