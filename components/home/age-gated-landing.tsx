"use client";

import { Pause, Play, Ticket, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { EventPurchaseForm } from "@/components/events/event-purchase-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { useMusic } from "@/lib/contexts/music-context";
import type { EventStatus, TicketType } from "@/lib/types";
import logo from "@/app/assets/logo.png";

type HomeEvent = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_date: string;
  location: string | null;
  cover_image_url: string | null;
  status: EventStatus;
  ticket_types?: TicketType[] | null;
};

type AgeGatedLandingProps = {
  event: HomeEvent | null;
};

const heroVideo = "/video-hero.mp4";
const fallbackHeroImage =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80";
const introTrack = "/audio/shiny-disco-balls-extended-mix.mp3";

export function AgeGatedLanding({ event }: AgeGatedLandingProps) {
  const [entered, setEntered] = useState(false);
  const [denied, setDenied] = useState(false);
  const { musicEnabled, toggleMusic } = useMusic();

  useEffect(() => {
    const ageVerified = sessionStorage.getItem("age_verified") === "true";
    if (ageVerified) {
      setEntered(true);
    }
  }, []);

  const activeTicketTypes = useMemo(
    () => (event?.ticket_types || []).filter((ticketType) => ticketType.is_active),
    [event?.ticket_types]
  );
  const heroImage = event?.cover_image_url || fallbackHeroImage;
  const availableTickets = activeTicketTypes.reduce(
    (sum, ticketType) => sum + Math.max(ticketType.stock - ticketType.sold_count, 0),
    0
  );

  async function enterSite() {
    setDenied(false);
    sessionStorage.setItem("age_verified", "true");
    setEntered(true);
    await toggleMusic();
  }

  if (!entered) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rio-black px-4 text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          poster={heroImage}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.46),rgba(5,7,13,0.92))]" />
        <div className="relative w-full max-w-md rounded-lg border border-white/10 bg-[#070b14]/88 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.54)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={logo.src}
              alt="logo"
              width={80}
              height={80}
              className="h-20 w-auto select-none"
              draggable={false}
            />
            <h1 className="text-3xl font-black leading-none text-center">¿Sos mayor de 18 años?</h1>
          </div>

          <div className="mt-6 grid gap-3">
            <Button onClick={enterSite} className="min-h-12 w-full text-base">
              <Play className="size-4" />
              Sí, entrar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDenied(true)}
              className="min-h-12 w-full bg-white/[0.06]"
            >
              <X className="size-4" />
              No
            </Button>
          </div>

          {denied ? (
            <div className="mt-4 rounded-lg border border-rio-red/35 bg-rio-red/10 p-3 text-sm text-red-100">
              Para acceder tenés que ser mayor de 18 años.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rio-black text-white">
      <SiteHeader />
      <main>
        <section className="relative flex min-h-[70svh] items-end justify-center overflow-hidden border-b border-white/10">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            autoPlay
            muted
            loop
            playsInline
            poster={heroImage}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.2)_0%,rgba(5,7,13,0.85)_100%)]" />

          <div className="relative mx-auto w-full max-w-3xl px-4 pb-12 pt-24">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl font-black leading-none sm:text-6xl text-center">
                {event?.name || "Rio Producciones"}
              </h1>
              {(event?.description || !event) ? (
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/[0.58] mx-auto text-center leading-none">
                  {event?.description || "Entradas digitales para eventos electrónicos."}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMusic}
            aria-label={musicEnabled ? "Pausar música" : "Activar música"}
            className="absolute bottom-6 right-6 inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/40 backdrop-blur-sm transition hover:border-white/20 hover:text-white/70"
          >
            {musicEnabled ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </section>

        <section id="entradas" className="mx-auto max-w-3xl px-4 py-12">
          {event ? (
            <EventPurchaseForm
              eventId={event.id}
              ticketTypes={activeTicketTypes}
              eventName={event.name}
              eventLocation={event.location}
              eventDate={event.event_date}
              availableTickets={availableTickets}
            />
          ) : (
            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-8 text-center">
              <Ticket className="mx-auto size-8 text-rio-cyan" />
              <h2 className="mt-4 text-2xl font-black">Entradas próximamente</h2>
              <p className="mt-3 text-sm leading-6 text-white/[0.5]">
                Cuando publiques el primer evento, la selección de entradas aparece acá.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
