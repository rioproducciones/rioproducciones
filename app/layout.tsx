import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { getSiteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Rio Producciones Tickets",
    template: "%s | Rio Producciones"
  },
  description:
    "Venta de entradas online con QR único y control de acceso en tiempo real para Rio Producciones.",
  openGraph: {
    title: "Rio Producciones Tickets",
    description: "Entradas digitales, QR único y check-in en tiempo real.",
    url: getSiteUrl(),
    siteName: "Rio Producciones"
  }
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
