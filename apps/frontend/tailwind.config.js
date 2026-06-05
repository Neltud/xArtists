/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom theme extensions here if needed
    },
  },
  plugins: [],
  // Safelist important dynamic classes if you use them
  safelist: [
    // Example: 'bg-red-500', 'text-blue-600'
  ],
}
