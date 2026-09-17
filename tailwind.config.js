/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Onwun brand: electric violet primary, sand + slate neutrals (2026 brand guidelines).
        surface: {
          page: '#e3e5e2',
          card: '#ffffff',
          sunken: '#d1d3ce',
        },
        ink: {
          primary: '#000000',
          secondary: '#626675',
          muted: '#8b8d99',
        },
        brand: {
          50: '#f5f4fe',
          100: '#e9e7fe',
          200: '#d2cffc',
          300: '#b9b4fb',
          400: '#948df9',
          500: '#6a60f6',
          600: '#5b53d4',
          700: '#4c45b1',
          800: '#3d388f',
          900: '#2d2867',
        },
        // Chart categorical/status colors stay on the CVD-validated dataviz reference
        // palette (see plugins/frontend-design skill dataviz reference) — not brand hues.
        series: {
          blue: '#2a78d6',
          orange: '#eb6834',
          aqua: '#1baf7a',
          yellow: '#eda100',
          magenta: '#e87ba4',
          green: '#008300',
          violet: '#4a3aa7',
          red: '#e34948',
        },
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
        },
      },
      fontFamily: {
        sans: ['Sora', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,11,11,0.04), 0 1px 1px rgba(11,11,11,0.03)',
        pop: '0 8px 24px rgba(11,11,11,0.10), 0 2px 6px rgba(11,11,11,0.06)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
