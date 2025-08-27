/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Royal blue (accent)
        primary: {
          DEFAULT: '#4169E1',
          50: '#eef2ff',
          100: '#dfe7ff',
          200: '#bfd0ff',
          300: '#9bb7ff',
          400: '#6f94f5',
          500: '#4169E1',
          600: '#304fb0',
          700: '#27408b',
          800: '#1f346f',
          900: '#1a2b5c',
        },
        // Slate/steel gray neutral scale
        neutral: {
          50: '#f8fafc', // off-white
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8', // slate/steel
          500: '#64748b',
          600: '#475569',
          700: '#334155', // charcoal-ish
          800: '#1f2937',
          900: '#0f172a',
        },
        offwhite: '#f8fafc',
        charcoal: '#334155',
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 2px 8px rgba(0,0,0,0.08)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
      },
      zIndex: {
        header: '100',
        overlay: '110',
        modal: '120',
      },
    },
  },
  plugins: [],
}



