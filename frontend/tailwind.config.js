/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e9dfff',
          200: '#d6c7ff',
          300: '#b89dff',
          400: '#9467ff',
          500: '#8866cc',
          600: '#6644aa',
          700: '#553388',
          800: '#442266',
          900: '#331144',
        },
        secondary: {
          50: '#e6f8ff',
          100: '#ccf0ff',
          200: '#99e1ff',
          300: '#66d1ff',
          400: '#33c2ff',
          500: '#3388cc',
          600: '#2266aa',
          700: '#1a5588',
          800: '#114466',
          900: '#083344',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 