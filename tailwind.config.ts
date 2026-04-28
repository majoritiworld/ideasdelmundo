import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      fontFamily: {
        heading: ["ArizonaFlare", "serif"],
        sans: ["ArizonaSans", "sans-serif"],
        mono: ["JetBrainsMono", "monospace"],
      },
    },
  },
} satisfies Config;
