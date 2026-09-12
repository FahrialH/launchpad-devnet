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
        background: '#090d16',
        surface: {
          DEFAULT: '#111827',
          card: '#161f32',
          border: '#1f293d',
          hover: '#1e293b'
        },
        solana: {
          purple: '#9945FF',
          green: '#14F195',
          dark: '#000000',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(153, 69, 255, 0.3)',
        'glow-green': '0 0 25px -5px rgba(20, 241, 149, 0.3)',
      }
    },
  },
  plugins: [],
}
