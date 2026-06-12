/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rugby: {
          green: '#1a5c2a',
          light: '#2d8a45',
          gold: '#c9a84c',
        }
      }
    }
  },
  plugins: [],
}
