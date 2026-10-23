import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Newsreader", "Charter", "Bitstream Charter", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        elenchus: {
          ground: "#0c0c0e",
          "surface-1": "#141417",
          "surface-2": "#1b1b20",
          "surface-3": "#23232a",
          border: "#26262d",
          "border-strong": "#383842",
          chalk: "#f3f3ee",
          stone: "#9e9ea7",
          muted: "#63636f",
          terracotta: {
            DEFAULT: "#d95d39",
            hover: "#e66a45",
            subtle: "rgba(217, 93, 57, 0.12)",
            glow: "rgba(217, 93, 57, 0.25)",
          },
          amber: "#d97706",
          emerald: "#059669",
          crimson: "#e11d48",
          indigo: "#6366f1",
        },
      },
      animation: {
        "breathe-slow": "breathe 4s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 2.5s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "ripple": "ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        ripple: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      transitionTimingFunction: {
        "spring-tactile": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "spring-smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
