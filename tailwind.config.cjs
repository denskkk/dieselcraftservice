module.exports = {
  content: [
    './*.html',
    './poslugy/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        'dc-black': '#050505',
        'dc-dark': '#111111',
        'dc-darkgray': '#1a1a1a',
        'dc-red': '#C1121F',
        'dc-darkred': '#8B0000',
        'dc-white': '#FFFFFF',
        'dc-gray': '#6b7280',
        'dc-light': '#d1d5db',
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(193,18,31,0.4), 0 0 60px rgba(193,18,31,0.15)',
        'red-sm': '0 0 10px rgba(193,18,31,0.3)',
        premium: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        header: '0 4px 30px rgba(0,0,0,0.7), 0 1px 0 rgba(193,18,31,0.2)',
      },
      backdropBlur: {
        premium: '20px',
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  plugins: [],
};