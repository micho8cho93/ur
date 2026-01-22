/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        royal: {
          blue: "#1e3a8a", // Lapis Lazuli
          gold: "#f59e0b", // Gold highlights
        },
        stone: {
          light: "#f3f4f6",
          dark: "#1f2937",
        },
        // British Museum artifact palette
        wood: {
          dark: "#1a120b", // Dark Lacquered Wood / Bitumen
        },
        ivory: "#f3e5ab", // Cream/Off-White for tiles
        lapis: "#1e3a8a", // Deep Royal Blue for tiles
        carnelian: "#7f1d1d", // Deep Red for accents
        pearl: "#f5f5f4", // Light piece color
        onyx: "#1e293b", // Dark piece color
      },
      fontFamily: {
        cinzel: ['serif'], // Fallback to serif, can be replaced with custom font
      },
    },
  },
  plugins: [],
}
