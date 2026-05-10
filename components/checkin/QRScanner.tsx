"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserCodeReader, BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type CameraStatus = "starting" | "ready" | "paused";

function getCameraErrorMessage(error: unknown) {
  const name =
    error && typeof error === "object" && "name" in error ? String((error as { name?: unknown }).name) : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "El navegador bloqueó la cámara. Habilitá permisos o usá ingreso manual.";
  }

  if (name === "NotFoundError") {
    return "No encontramos una cámara disponible.";
  }

  if (name === "NotReadableError" || name === "AbortError") {
    return "La cámara está en uso por otra app o no pudo iniciarse.";
  }

  if (name === "OverconstrainedError") {
    return "No pudimos usar esa cámara. Probá con otra del selector.";
  }

  return "No pudimos acceder a la cámara. Revisá permisos o usá ingreso manual.";
}

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
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    async function refreshDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) {
        if (active) setError("Este navegador no permite enumerar cámaras.");
        return;
      }

      try {
        const videoDevices = await BrowserCodeReader.listVideoInputDevices();

        if (!active) return;

        setDevices(videoDevices);

        if (videoDevices.length === 0) {
          setError("No encontramos una cámara disponible.");
        }
      } catch (deviceError) {
        if (active) setError(getCameraErrorMessage(deviceError));
      }
    }

    refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);

    return () => {
      active = false;
      navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("paused");
      return;
    }

    if (disabled) {
      setStatus("paused");
      return;
    }

    if (!videoRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("paused");
      setError("Este navegador no permite usar la cámara.");
      return;
    }

    let controls: IScannerControls | undefined;
    let stopped = false;
    const reader = new BrowserMultiFormatReader();

    setStatus("starting");
    setError(null);

    reader
      .decodeFromVideoDevice(deviceId || undefined, videoRef.current, (result) => {
        const text = result?.getText();
        if (!text) return;

        const now = Date.now();
        const last = lastScanRef.current;

        if (last?.value === text && now - last.at < 3500) return;

        lastScanRef.current = { value: text, at: now };
        onScan(text);
      })
      .then(async (scannerControls) => {
        if (stopped) {
          scannerControls.stop();
          return;
        }

        controls = scannerControls;
        setStatus("ready");
        setError(null);

        try {
          const videoDevices = await BrowserCodeReader.listVideoInputDevices();
          if (!stopped) setDevices(videoDevices);
        } catch {
          // Device labels are a nicety after permission is granted. Scanning can continue without them.
        }
      })
      .catch((cameraError) => {
        if (stopped) return;

        setStatus("paused");
        setError(getCameraErrorMessage(cameraError));
      });

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [deviceId, disabled, enabled, onScan]);

  const helperText =
    (enabled && error) ||
    (!enabled
      ? "Cámara pausada"
      : status === "starting"
        ? "Activando cámara..."
        : "Apuntá al QR de la entrada.");

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
      <div className="relative aspect-[3/4] max-h-[70svh]">
        {enabled ? (
          <video ref={videoRef} className="size-full object-cover" autoPlay muted playsInline />
        ) : (
          <div className="flex size-full items-center justify-center text-white/50">
            Cámara pausada
          </div>
        )}
        <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-rio-cyan/80" />
        {enabled && status === "starting" && !error ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white/70">
            Activando cámara...
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 border-t border-white/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/[0.55]">{helperText}</p>
          <Button
            variant="secondary"
            className="size-11 shrink-0 px-0"
            aria-label={enabled ? "Pausar cámara" : "Activar cámara"}
            title={enabled ? "Pausar cámara" : "Activar cámara"}
            onClick={() => setEnabled((value) => !value)}
          >
            {enabled ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          </Button>
        </div>
        {devices.length > 1 ? (
          <select
            aria-label="Cámara"
            className="focus-ring min-h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value)}
          >
            <option value="">Cámara automática</option>
            {devices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `Cámara ${index + 1}`}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
