/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ss: {
          ink: "#0a1b14",
          paper: "#fbfdfc",
          brand: { DEFAULT: "#0f6e56", vivid: "#1d9e75", soft: "#e1f5ee" },
          lime: { DEFAULT: "#97c459", deep: "#3b6d11", soft: "#eaf3de" },
          royal: { DEFAULT: "#185fa5", vivid: "#378add", soft: "#e6f1fb" },
          amber: { DEFAULT: "#ef9f27", deep: "#854f0b", soft: "#faeeda" },
          coral: { DEFAULT: "#d85a30", deep: "#993c1d", soft: "#faece7" },
        },
      },
      fontFamily: {
        display: ['"Archivo"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
