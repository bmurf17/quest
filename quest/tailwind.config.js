/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "battle-background": "url('../src/assets/battle%20background.jpg')",
      },
    },
  },
  plugins: [],
};
