/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ProjectDesk navy/blue/teal palette
        navy: {
          50: '#f0f4fa',
          100: '#dde7f4',
          200: '#c0d2ec',
          300: '#94b4de',
          400: '#628ecb',
          500: '#3f70b5',
          600: '#2f579a',
          700: '#28467c',
          800: '#243d68',
          900: '#16233c',
          950: '#0e1728',
        },
        brand: {
          50: '#eef5ff',
          100: '#dceafe',
          200: '#c0d8fd',
          300: '#94bdfb',
          400: '#619bf7',
          500: '#3c78f2',
          600: '#2759e6',
          700: '#2045d3',
          800: '#213bab',
          900: '#213787',
        },
        teal: {
          50: '#effdfa',
          100: '#c8fbf0',
          200: '#91f4e4',
          300: '#55e7d5',
          400: '#26d1c2',
          500: '#0db5aa',
          600: '#09918c',
          700: '#0b7471',
          800: '#0d5c5b',
          900: '#0f4c4c',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 35, 60, 0.06), 0 1px 3px rgba(22, 35, 60, 0.08)',
        'card-hover': '0 4px 8px -2px rgba(22, 35, 60, 0.12), 0 2px 4px -2px rgba(22, 35, 60, 0.08)',
        overlay: '0 20px 25px -5px rgba(22, 35, 60, 0.2), 0 8px 10px -6px rgba(22, 35, 60, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
