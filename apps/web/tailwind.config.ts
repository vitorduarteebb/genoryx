import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#07060c",
        panel: "#12101c",
        gold: "#e4c36a",
        crystal: "#7ee0d6",
        ember: "#ff6b35",
        muted: "#9a90a8",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
