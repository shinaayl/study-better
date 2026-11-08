/** @type {import('tailwindcss').Config} */
export default {
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
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        univ: {
          purple: '#6b21a8',
          deep: '#581c87',
          light: '#f5f3ff',
          lavender: '#faf5ff',
          border: '#e9d5ff',
          accent: '#7c3aed',
        },
        uiGreen: {
          50: '#f0fdf4',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        }
      }
    },
  },
  plugins: [],
}
