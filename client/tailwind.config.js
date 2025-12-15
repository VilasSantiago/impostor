/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "game-primary-bg": "#000050",
        "game-primary-fg": "#00FFBE",
      },
      fontFamily: {
        'game': ['"Orbitron"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}