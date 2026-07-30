import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        paper: "#f7f3ea",
        leaf: "#27724d",
        coral: "#e05244"
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "-apple-system", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
