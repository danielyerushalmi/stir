import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: { DEFAULT: '#E8630A', dark: '#C4520A', light: '#FEF0E7' },
        charcoal: '#1A1A2E',
        'warm-gray': '#F9F6F2',
        border: '#E8E0D8',
        'text-muted': '#5F5E5A',
        'text-lighter': '#888780',
        green: { DEFAULT: '#2D9B6F', light: '#EAF3DE' },
        'amber-light': '#FAEEDA',
        'amber-dark': '#633806',
        'red-light': '#FCEBEB',
        'red-dark': '#A32D2D',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
