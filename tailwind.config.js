/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "battle-background": "url(../src/assets/forrest-background.png)",
        "town-background": "url(../src/assets/town1-background.png)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        flash: {
          "0%": {
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) brightness(1)",
          },
          "15%": {
            filter:
              "drop-shadow(0 0 20px rgba(255,0,0,1)) brightness(2) saturate(0)",
          },
          "30%": {
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) brightness(1)",
          },
          "45%": {
            filter:
              "drop-shadow(0 0 20px rgba(255,0,0,1)) brightness(2) saturate(0)",
          },
          "60%": {
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) brightness(1)",
          },
          "75%": {
            filter:
              "drop-shadow(0 0 15px rgba(255,0,0,0.8)) brightness(1.5) saturate(0)",
          },
          "100%": {
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) brightness(1)",
          },
        },
      },
      animation: {
        flash: "flash 0.6s ease-in-out",
      },
      colors: {
        gold: {
          DEFAULT: "#D4AF37",
          muted: "#C9A84C",
          dark: "rgb(180 140 80)",
        },
        text: {
          DEFAULT: "#E8DCC8",
          muted: "#A8916A",
        },
        muted: "#9CA3AF",
        success: "#34D399",
        danger: "#EF4444",
        warning: "#F2A444",
        info: "#0099DB",
        surface: {
          DEFAULT: "#1A1A2E",
          alt: "#2B2033",
        },
        subtle: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body: ["Lato", "sans-serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
        ".bg-pixelated": {
          "image-rendering": "pixelated",
        },
      });
    },
  ],
};
