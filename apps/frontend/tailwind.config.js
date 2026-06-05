/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // or 'media' if you prefer system preference
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Main violet
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        zinc: {
          950: '#09090b', // Deeper dark
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
  safelist: [
    // Add dynamic classes here if needed
    // 'bg-red-500', 'text-emerald-400'
  ],
}
