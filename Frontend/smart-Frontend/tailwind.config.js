export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'pulse-inout': 'pulse-inout 2.2s ease-in-out infinite',
        'spin-reverse': 'spin-reverse 1.5s linear infinite',
        'rocket-move': 'rocket-move 5s cubic-bezier(0.4,0,0.2,1) 1',
      },
      keyframes: {
        'pulse-inout': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'rocket-move': {
          '0%': { left: '-100px', opacity: 0 },
          '10%': { opacity: 1 },
          '90%': { opacity: 1 },
          '100%': { left: '100%', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};