/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B132B',
          charcoal: '#1C2541',
          orange: '#F8961E',
          amber: '#F9C74F',
          white: '#FFFFFF',
          offwhite: '#F8F9FA',
          gray: '#6C757D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
