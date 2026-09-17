/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#030712',
        surfaceCard: '#0F172A',
        surfaceCardLight: '#1E293B',
        surfaceBorder: '#334155',
        feltGreen: '#0A5C36',
        accentCyan: '#06B6D4',
        accentGold: '#F59E0B',
        accentGoldBright: '#FBBF24',
        statusWin: '#10B981',
        statusLoss: '#EF4444'
      }
    },
  },
  plugins: [],
}
