/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/**/*.{html,js}',
    './imports/**/*.{html,js}',
    './public/**/*.{html,js}',
    './server/**/*.{html,js}'
  ],
  theme: {
    extend: {
      colors: {
        'qrl-primary': '#1a1a1a',
        'qrl-secondary': '#2d2d2d',
        'qrl-accent': '#FFA729',
        'qrl-text': '#ffffff',
        'qrl-text-secondary': '#b3b3b3',
        'qrl-border': '#404040',
      },
      fontFamily: {
        'din': ['Alte DIN 1451 Mittelschrift', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
