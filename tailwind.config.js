/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/**/*.{html,js}',
    './imports/**/*.{html,js}',
    './public/**/*.{html,js}',
    './server/**/*.{html,js}'
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'qrl-primary': '#1a1a1a',
        'qrl-secondary': '#2d2d2d',
        'qrl-surface': '#252525',
        'qrl-accent': '#FFA729',
        'qrl-accent-secondary': '#4AAFFF',
        'qrl-blue': '#4AAFFF',
        'qrl-text': '#ffffff',
        'qrl-text-secondary': '#b3b3b3',
        'qrl-border': '#404040',
      },
      fontFamily: {
        'din': ['Alte DIN 1451 Mittelschrift', 'sans-serif'],
        'mono': ['Hack', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'accent': '0 0 12px rgba(255, 167, 41, 0.15)',
        'accent-lg': '0 0 24px rgba(255, 167, 41, 0.25)',
        'blue': '0 0 12px rgba(74, 175, 255, 0.15)',
        'inner-glow': 'inset 0 1px 2px rgba(255, 255, 255, 0.04)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, rgba(255, 167, 41, 0.1), rgba(74, 175, 255, 0.05))',
        'gradient-card-top': 'linear-gradient(90deg, #FFA729, #4AAFFF)',
        'gradient-header-border': 'linear-gradient(90deg, #FFA729, #4AAFFF, transparent)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'card-hover': 'cardHover 0.2s ease-out forwards',
      },
      keyframes: {
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
