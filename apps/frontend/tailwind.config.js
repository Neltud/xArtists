/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          rose: '#fb7185',
          ink: '#06060b',
          panel: '#0c0c14',
          line: '#1e1e2e',
        },
        surface: {
          0: '#06060b',
          1: '#0c0c14',
          2: '#12121c',
          3: '#1a1a28',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Syne"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(139, 92, 246, 0.45)',
        'glow-cyan': '0 0 32px -8px rgba(34, 211, 238, 0.35)',
        card: '0 8px 32px -12px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(139,92,246,0.22), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(34,211,238,0.12), transparent), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(251,113,133,0.08), transparent)',
        'mesh':
          'linear-gradient(180deg, rgba(6,6,11,0.2) 0%, rgba(6,6,11,0.95) 100%)',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.35s ease-out',
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
