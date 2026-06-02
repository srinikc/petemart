import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pm-gold': '#C8A45C',
        'pm-gold-dark': '#B8944C',
        'pm-burgundy': '#6B1D3A',
        'pm-cream': '#FFF8EE',
        'pm-text': '#2D2D2D',
        'pm-text-secondary': '#6B7280',
        'pm-border': '#E5E7EB',
        'pm-error': '#DC2626',
        'pm-success': '#16A34A',
        'pm-bg': '#FAFAFA',
        'mode-a': '#2E7D32',
        'mode-b': '#25D366',
        'mode-c': '#1976D2',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'pm-sm': '6px',
        'pm-md': '8px',
        'pm-lg': '12px',
        'pm-xl': '16px',
      },
      boxShadow: {
        'pm-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'pm-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'pm-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'pm-h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'pm-h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'pm-h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'pm-body': ['1rem', { lineHeight: '1.5rem' }],
        'pm-small': ['0.875rem', { lineHeight: '1.25rem' }],
        'pm-tiny': ['0.75rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
