/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#050d1a',
          2: '#0a1628',
          3: '#0f2040',
          4: '#162a50',
        },
        neon: {
          green: '#00e676',
          blue: '#00b0ff',
          gold: '#ffd600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-field': 'linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #050d1a 100%)',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 230, 118, 0.3)',
        'neon-blue': '0 0 20px rgba(0, 176, 255, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeInUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
