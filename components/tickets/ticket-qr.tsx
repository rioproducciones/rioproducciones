"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQr({ value }: { value: string }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <QRCodeSVG value={value} size={256} level="H" includeMargin />
    </div>
  );
}
