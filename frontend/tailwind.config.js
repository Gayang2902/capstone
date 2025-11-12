/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./main.js",
    "./preload.js",
    "./src/renderer/**/*.{jsx,js,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
