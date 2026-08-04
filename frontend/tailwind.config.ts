import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sistema de colores de Vivero / Tienda
        cream: "#F5F5F3",           // fondo principal neutro
        forest: {
          dark: "#111810",          // top banner, footer, newsletter
          mid: "#253824",           // sección servicios
          deep: "#1A2B1C",          // botones primarios
          accent: "#3D6040",        // links y acentos
          light: "#E8EDE5",         // fondos verdes suaves
        },
        // Brand original (se mantiene para otros usos)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
        widest3: "0.25em",
      },
    },
  },
  plugins: [],
} satisfies Config;
