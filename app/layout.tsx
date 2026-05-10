import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { getSiteUrl } from "@/lib/env";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

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
    <html lang="es" className={instrumentSans.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
