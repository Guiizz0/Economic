const c = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        panel: c('panel'),
        panel2: c('panel2'),
        line: c('line'),
        text: c('text'),
        muted: c('muted'),
        brand: c('brand'),
        brand2: c('brand2'),
        up: c('up'),
        down: c('down'),
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--brand) / 0.35), 0 8px 30px -8px rgb(var(--brand) / 0.45)',
      },
    },
  },
  plugins: [],
}
