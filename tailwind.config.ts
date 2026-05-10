import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      colors: {
        rio: {
          black: "#05070d",
          ink: "#08111f",
          panel: "#0d1423",
          line: "rgba(255,255,255,0.1)",
          cyan: "#00e5ff",
          violet: "#8b5cf6",
          green: "#22c55e",
          yellow: "#facc15",
          red: "#ef4444"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 229, 255, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
