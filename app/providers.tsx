"use client";

import { MusicProvider } from "@/lib/contexts/music-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <MusicProvider>{children}</MusicProvider>;
}
