import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f5f4",
        surface: "#ffffff",
        "surface-alt": "#faf9f8",
        primary: {
          DEFAULT: "#5e6ad2",
          hover: "#6b76dd",
        },
        ink: {
          DEFAULT: "#33373d",
          strong: "#1a1d21",
          mid: "#4a4d52",
          soft: "#615d59",
          muted: "#8f8a82",
          faint: "#a39e98",
          ghost: "#b3aea8",
        },
        line: {
          DEFAULT: "#eae8e4",
          strong: "#e6e4e0",
          soft: "#efeeeb",
          faint: "#f2f1ee",
        },
        "row-selected": "#f5f5fb",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
