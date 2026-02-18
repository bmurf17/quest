/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "battle-background": "url(../src/assets/area1-background.png)",
      },
      // Add a custom utility plugin for pixelated rendering
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
      colors: {},
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
