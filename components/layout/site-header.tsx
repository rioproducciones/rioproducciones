import Link from "next/link";
import { CalendarDays, Gauge, Ticket } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-rio-black/86 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-sm font-black text-rio-cyan">
            R
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide">Rio Producciones</span>
            <span className="block text-xs text-white/[0.48]">Tickets & Access</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-white/[0.68]">
          <Link className="hidden rounded-lg px-3 py-2 hover:bg-white/[0.08] sm:inline-flex" href="/eventos">
            Eventos
          </Link>
          <Link className="rounded-lg p-2 hover:bg-white/[0.08] sm:hidden" href="/eventos" aria-label="Eventos">
            <CalendarDays className="size-5" />
          </Link>
          <Link className="hidden rounded-lg px-3 py-2 hover:bg-white/[0.08] sm:inline-flex" href="/admin">
            Admin
          </Link>
          <Link className="rounded-lg p-2 hover:bg-white/[0.08] sm:hidden" href="/admin" aria-label="Admin">
            <Gauge className="size-5" />
          </Link>
          <Link
            className="ml-1 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-semibold text-black hover:bg-cyan-100"
            href="/eventos"
          >
            <Ticket className="size-4" />
            <span className="hidden sm:inline">Comprar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
