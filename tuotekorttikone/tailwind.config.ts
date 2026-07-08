import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0b0d',
          900: '#111114',
          850: '#16161a',
          800: '#1c1c21',
          700: '#26262d',
          600: '#3a3a44',
          400: '#8b8b98',
          300: '#b3b3bf',
          100: '#ececf1',
          50: '#f7f7f9',
        },
        brass: {
          DEFAULT: '#c9a15a',
          bright: '#e2bd77',
          dim: '#8a6c37',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.25), 0 12px 40px -12px rgba(0,0,0,.45)',
        pop: '0 24px 80px -24px rgba(0,0,0,.55)',
      },
    },
  },
  plugins: [],
} satisfies Config
