/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        surface: {
          page: '#f9f9f7',
          card: '#ffffff',
          sunken: '#f2f1ee',
        },
        ink: {
          primary: '#0b0b0b',
          secondary: '#52514e',
          muted: '#898781',
        },
        brand: {
          50: '#eef4fd',
          100: '#dce9fb',
          200: '#b7d3f6',
          300: '#86b6ef',
          400: '#5598e7',
          500: '#2a78d6',
          600: '#1c5cab',
          700: '#184f95',
          800: '#104281',
          900: '#0d366b',
        },
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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
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
