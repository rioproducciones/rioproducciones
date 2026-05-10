"use client";

import { useCallback, useState } from "react";
import { Keyboard, ScanLine } from "lucide-react";
import { CheckinResult, type CheckinResultData } from "@/components/checkin/CheckinResult";
import { QRScanner } from "@/components/checkin/QRScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { extractQrToken } from "@/lib/utils";

type EventOption = {
  id: string;
  name: string;
};

export function CheckinClient({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [gateName, setGateName] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<CheckinResultData | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastToken, setLastToken] = useState("");

  const validateToken = useCallback(
    async (rawToken: string) => {
      const token = extractQrToken(rawToken);

      if (!token || !eventId) return;

      setLastToken(token);
      setValidating(true);

      const response = await fetch("/api/checkin/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          event_id: eventId,
          gate_name: gateName || null
        })
      });

      const payload = await response.json();
      setResult(payload);
      setValidating(false);
    },
    [eventId, gateName]
  );

  async function confirm() {
    if (!lastToken || !eventId) return;

    setConfirming(true);
    const response = await fetch("/api/checkin/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: lastToken,
        event_id: eventId,
        gate_name: gateName || null
      })
    });
    const payload = await response.json();
    setResult(payload);
    setConfirming(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <section className="grid gap-3">
        <Select value={eventId} onChange={(event) => setEventId(event.target.value)}>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Puerta / mesa opcional"
          value={gateName}
          onChange={(event) => setGateName(event.target.value)}
        />
        <QRScanner onScan={validateToken} disabled={!eventId || validating || confirming} />
      </section>
      <section className="grid h-fit gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Keyboard className="size-4 text-rio-cyan" />
            Ingreso manual
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Pegar token o URL"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
            />
            <Button onClick={() => validateToken(manualToken)} disabled={validating || !manualToken}>
              <ScanLine className="size-4" />
            </Button>
          </div>
        </div>
        <CheckinResult result={result} onConfirm={confirm} confirming={confirming} />
      </section>
    </div>
  );
}
