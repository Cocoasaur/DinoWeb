/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'space': ['"Space Grotesk"', 'monospace'],
        'inter': ['Inter', 'sans-serif'],
        'noto': ['"Noto Serif"', 'serif'],
        'public': ['"Public Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
