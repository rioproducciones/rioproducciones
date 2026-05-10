import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublishedEvents } from "@/lib/public-data";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getPublishedEvents();
  const nextEvent = events[0];
  const heroImage =
    nextEvent?.cover_image_url ||
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80";

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main>
        <section className="relative min-h-[82svh] overflow-hidden">
          <Image src={heroImage} alt="" fill priority className="object-cover opacity-[0.52]" />
          <div className="absolute inset-0 bg-black/[0.62]" />
          <div className="relative mx-auto flex min-h-[82svh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-rio-cyan">
              Rio Access
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-none sm:text-7xl">
              Rio Producciones
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/[0.72]">
              Entradas digitales para eventos electrónicos, QR único por ticket y control de acceso
              online en tiempo real.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={nextEvent ? `/evento/${nextEvent.slug}` : "/eventos"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-rio-cyan px-4 font-semibold text-black shadow-glow hover:bg-cyan-200"
              >
                Comprar entradas
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/admin/checkin"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-4 font-semibold hover:bg-white/[0.15]"
              >
                Check-in staff
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {[
            { icon: CalendarDays, title: "Eventos publicados", text: "Landing, venta y stock por tipo de entrada." },
            { icon: QrCode, title: "QR único", text: "Token largo no enumerable y validación server-side." },
            { icon: ShieldCheck, title: "Acceso en vivo", text: "Check-in atómico, Realtime y alertas de repetidos." }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <Icon className="size-6 text-rio-cyan" />
                <h2 className="mt-4 font-bold">{item.title}</h2>
                <p className="mt-2 text-sm text-white/[0.56]">{item.text}</p>
              </div>
            );
          })}
        </section>

        {nextEvent ? (
          <section className="mx-auto max-w-6xl px-4 pb-14">
            <Link
              href={`/evento/${nextEvent.slug}`}
              className="grid overflow-hidden rounded-xl border border-white/10 bg-rio-panel md:grid-cols-[1fr_1.2fr]"
            >
              <div className="relative min-h-64">
                <Image src={heroImage} alt={nextEvent.name} fill className="object-cover" />
              </div>
              <div className="p-5 sm:p-7">
                <p className="text-sm font-semibold text-rio-cyan">Próximo evento</p>
                <h2 className="mt-2 text-2xl font-black">{nextEvent.name}</h2>
                <p className="mt-3 text-white/[0.58]">{formatDateTime(nextEvent.event_date)}</p>
                <p className="mt-1 text-white/[0.58]">{nextEvent.location}</p>
                <p className="mt-5 text-sm text-white/[0.62]">{nextEvent.description}</p>
              </div>
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  );
}
