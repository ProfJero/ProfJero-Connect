/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // slate-500 nudged darker so secondary text passes WCAG AA (4.5:1)
        // on the grey page backgrounds, not just on white.
        slate: { 500: '#5b6b80' },
      },
      boxShadow: {
        // Tailwind v4 alias used by the source HTML
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};