"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QRScanner({
  onScan,
  disabled
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || disabled || !videoRef.current) return;

    let controls: IScannerControls | undefined;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        const text = result?.getText();
        if (!text) return;

        const now = Date.now();
        const last = lastScanRef.current;

        if (last?.value === text && now - last.at < 3500) return;

        lastScanRef.current = { value: text, at: now };
        onScan(text);
      })
      .then((scannerControls) => {
        controls = scannerControls;
        setError(null);
      })
      .catch(() => {
        setError("No pudimos acceder a la cámara. Revisá permisos o usá ingreso manual.");
      });

    return () => {
      controls?.stop();
    };
  }, [disabled, enabled, onScan]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
      <div className="relative aspect-[3/4] max-h-[70svh]">
        {enabled ? (
          <video ref={videoRef} className="size-full object-cover" muted playsInline />
        ) : (
          <div className="flex size-full items-center justify-center text-white/50">
            Cámara pausada
          </div>
        )}
        <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-rio-cyan/80" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 p-3">
        <p className="text-sm text-white/[0.55]">{error || "Apuntá al QR de la entrada."}</p>
        <Button variant="secondary" className="size-11 px-0" onClick={() => setEnabled((value) => !value)}>
          {enabled ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
