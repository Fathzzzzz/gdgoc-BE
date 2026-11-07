/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#14181c',
          surface: '#1e242b',
          surfaceHover: '#262f38',
          card: '#222831',
          border: '#303843',
          muted: '#8996a6',
          green: '#00e054',
          orange: '#ff8000',
          blue: '#40bcf4',
        },
      },
    },
  },
  plugins: [],
};