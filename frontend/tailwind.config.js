/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 8s ease-in-out infinite',
        'slideUp': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 
            'background-position': '0% 50%'
          },
          '50%': { 
            'background-position': '100% 50%'
          },
        },
        slideUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(40px) scale(0.96)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}
