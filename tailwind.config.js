/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          dark: '#0A1628', surface: '#132035', surface2: '#1C2D47',
          border: '#2A4066', primary: '#1B2A4A', primaryLight: '#2D4A7A',
          accent: '#00D4AA', warm: '#F5A623', red: '#E63946',
          text: '#E8EDF5', muted: '#4A6080', secondary: '#8A9BB5',
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
