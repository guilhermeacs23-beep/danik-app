import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FAF5F0',
          100: '#F5EDE3',
          200: '#EAD5C0',
          300: '#D4A882',
          400: '#C4956A',
          500: '#B07850',
          600: '#8B5E3C',
          700: '#6B4527',
          800: '#4D3019',
          900: '#3D2B1F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
