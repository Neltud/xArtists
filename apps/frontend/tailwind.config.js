/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#7c3aed',
        },
      },
      boxShadow: {
        // Base shadows
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        
        // Custom elegant shadows for dark UI
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.15)',
        
        // Colored glows
        'glow-violet': '0 0 0 1px rgb(124 58 237 / 0.15), 0 10px 15px -3px rgb(124 58 237 / 0.2)',
        'glow-soft': '0 0 15px -3px rgb(124 58 237 / 0.25)',
        
        // Strong elevation
        'elevated': '0 25px 50px -12px rgb(0 0 0 / 0.4)',
      }
    },
  },
  plugins: [],
}
