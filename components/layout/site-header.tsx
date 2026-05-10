import Link from "next/link";
import logo from "@/app/assets/logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-rio-black/86 backdrop-blur-xl">
      <div className="relative h-[50px] mx-auto flex max-w-6xl items-center px-4 py-3">
        <div className="flex flex-1 justify-start" />

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <img src={logo.src} alt="logo" className="h-16 w-auto select-none" draggable={false} />
        </Link>

      </div>
    </header>
  );
}
