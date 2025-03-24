/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Twilight theme colors
        twilight: {
          darker: '#0A0C14',
          dark: '#12141F',
          primary: '#1A1E2E',
          secondary: '#242A3F',
          accent: '#2E3650',
          'neon-blue': '#4DABF7',
          'neon-purple': '#BE4BDB',
          'neon-pink': '#E64980',
          'neon-green': '#51CF66',
        },
        // UI colors
        ui: {
          success: '#51CF66',
          warning: '#FCC419',
          error: '#FF6B6B',
          info: '#4DABF7',
        },
      },
      boxShadow: {
        'neon-blue': '0 0 5px rgba(77, 171, 247, 0.5), 0 0 20px rgba(77, 171, 247, 0.3)',
        'neon-purple': '0 0 5px rgba(190, 75, 219, 0.5), 0 0 20px rgba(190, 75, 219, 0.3)',
        'neon-pink': '0 0 5px rgba(230, 73, 128, 0.5), 0 0 20px rgba(230, 73, 128, 0.3)',
        'neon-green': '0 0 5px rgba(81, 207, 102, 0.5), 0 0 20px rgba(81, 207, 102, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(46, 54, 80, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(46, 54, 80, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-pattern': '20px 20px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px rgba(77, 171, 247, 0.5), 0 0 10px rgba(77, 171, 247, 0.3)' },
          '100%': { textShadow: '0 0 10px rgba(77, 171, 247, 0.8), 0 0 20px rgba(77, 171, 247, 0.5), 0 0 30px rgba(77, 171, 247, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}