/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0c192c',
          darker: '#08111e',
          cardDark: '#12233c',
          blue: '#1a6cf0',
          blueHover: '#155cd0',
          accent: '#38bdf8',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        soft: '0 4px 16px -4px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};