/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'pm-gold': '#C8A45C',
        'pm-gold-dark': '#A8893A',
        'pm-burgundy': '#6B1D3A',
        'pm-cream': '#FFF8EE',
        'pm-text': '#2D2D2D',
        'pm-text-secondary': '#666666',
        'pm-border': '#E0E0E0',
        'mode-buy': '#2E7D32',
        'mode-whatsapp': '#25D366',
        'mode-visit': '#1976D2',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
