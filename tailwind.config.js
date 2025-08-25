/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c7be5',
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b9dbff',
          300: '#8cc2ff',
          400: '#5ca3f6',
          500: '#2c7be5',
          600: '#1f5fbe',
          700: '#184c98',
          800: '#153f7c',
          900: '#123466',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}



