/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f1f3d',
          50: '#eef2fb',
          500: '#3b6acb',
          600: '#2f55a8',
        },
      },
    },
  },
  plugins: [],
};
