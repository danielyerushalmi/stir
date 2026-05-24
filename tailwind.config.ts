import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: { DEFAULT: '#E8630A', dark: '#C4520A', light: '#FEF0E7' },
        brown: { DEFAULT: '#2C1810', mid: '#5C3D2E' },
        cream: { DEFAULT: '#FAF7F2', dark: '#F2EDE4' },
        border: '#E8DDD2',
        'text-muted': '#5C3D2E',
        'text-lighter': '#9C8778',
        green: { DEFAULT: '#2D9B6F', light: '#EAF3DE' },
        'amber-light': '#FAEEDA',
        'amber-dark': '#633806',
        'red-light': '#FCEBEB',
        'red-dark': '#A32D2D',
        // keep as aliases so existing components don't break
        charcoal: '#2C1810',
        'warm-gray': '#FAF7F2',
      },
      fontFamily: { sans: ['var(--font-figtree)', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
