import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0a0a0a",
        cream: "#f5f2eb",
        acid: "#c8f135",
        orange: "#ff5e1a",
        slate: "#1c1c1e",
        mid: "#2e2e33",
        muted: "#6b6b72",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "cursive"],
        syne: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        blink: {
          "0%, 90%, 100%": { borderColor: "rgba(200,241,53,0.3)" },
          "95%": { borderColor: "rgba(200,241,53,0.8)" },
        },
      },
      animation: {
        "fade-up-1": "fadeUp 0.8s 0.2s forwards",
        "fade-up-2": "fadeUp 0.9s 0.35s forwards",
        "fade-up-3": "fadeUp 0.9s 0.5s forwards",
        "fade-up-4": "fadeUp 0.9s 0.65s forwards",
        "fade-up-5": "fadeUp 0.9s 0.8s forwards",
        "slide-in": "slideIn 1s 0.6s forwards",
        blink: "blink 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
