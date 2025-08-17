/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./demo.html",
    "./src/demo-site/**/*.{js,ts,jsx,tsx}",
    "./src/widget/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6d02a3',
          dark: '#4e0174',
        },
        accent: '#b12df4',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}