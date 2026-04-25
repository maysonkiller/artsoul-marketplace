/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          bg: '#f5f5f5',
          text: '#1a1a1a',
          accent: '#0066cc',
        },
        future: {
          bg: '#0a0a0f',
          text: '#e0e0ff',
          neon: '#00ffff',
          pink: '#ff00ff',
          purple: '#8b00ff',
        },
      },
    },
  },
  plugins: [],
}
