/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ayush: {
          50: '#f0f9f4',
          100: '#dcf0e4',
          200: '#bae2cd',
          300: '#8ecdb1',
          400: '#5cb291',
          500: '#389675',
          600: '#27785e',
          700: '#1f604c',
          800: '#1c4d3e',
          900: '#184034',
          950: '#0c241d',
        },
        ayushGold: {
          50: '#fbf9eb',
          100: '#f5efc7',
          200: '#ecd992',
          300: '#e1be57',
          400: '#d8a52c',
          500: '#c58e1d',
          600: '#a36d16',
          700: '#7b4c15',
          800: '#673e17',
          900: '#583418',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
