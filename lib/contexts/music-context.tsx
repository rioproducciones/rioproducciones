"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type MusicContextType = {
  musicEnabled: boolean;
  toggleMusic: () => Promise<void>;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Don't pause on unmount - let the audio continue
    };
  }, []);

  async function toggleMusic() {
    if (!audioRef.current) {
      const audio = new Audio("/audio/shiny-disco-balls-extended-mix.mp3");
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.46;
      audioRef.current = audio;
    }

    try {
      if (musicEnabled) {
        audioRef.current.pause();
        setMusicEnabled(false);
      } else {
        await audioRef.current.play();
        setMusicEnabled(true);
      }
    } catch (error) {
      setMusicEnabled(false);
    }
  }

  return (
    <MusicContext.Provider value={{ musicEnabled, toggleMusic }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within MusicProvider");
  }
  return context;
}
