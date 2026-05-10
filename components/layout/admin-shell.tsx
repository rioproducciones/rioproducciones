import Link from "next/link";
import { BarChart3, CalendarDays, LogOut, QrCode, Search, Users } from "lucide-react";
import type { UserRole } from "@/lib/types";

const links = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/checkin", label: "Check-in", icon: QrCode },
  { href: "/admin/checkin/manual", label: "Manual", icon: Search },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 }
];

export function AdminShell({
  children,
  fullName,
  role
}: {
  children: React.ReactNode;
  fullName?: string | null;
  role: UserRole;
}) {
  return (
    <div className="min-h-screen bg-rio-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-rio-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-rio-cyan text-sm font-black text-black">
              RA
            </span>
            <span>
              <span className="block text-sm font-bold">Rio Access</span>
              <span className="block text-xs text-white/[0.48]">{fullName || role}</span>
            </span>
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="focus-ring inline-flex size-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="size-5" />
              <span className="sr-only">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:h-[calc(100vh-6rem)]">
          <nav className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white md:justify-start md:text-sm"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
