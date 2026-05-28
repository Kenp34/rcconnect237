/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0F1117',
        surface:  '#181C27',
        surface2: '#1E2336',
        border:   '#2A2F45',
        accent:   '#4F8EF7',
        muted:    '#64748B',
      },
    },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  plugins: [],
}
