import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#C8A45C',
          foreground: '#FFFFFF',
          hover: '#A8893A',
          light: '#E8D5A8',
        },
        secondary: {
          DEFAULT: '#6B1D3A',
          foreground: '#FFFFFF',
          hover: '#50152A',
        },
        destructive: {
          DEFAULT: '#F44336',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F0E8',
          foreground: '#666666',
        },
        accent: {
          DEFAULT: '#FFF8EE',
          foreground: '#2D2D2D',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#2D2D2D',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2D2D2D',
        },
        // PeteMart specific brand colors
        'pm-gold': '#C8A45C',
        'pm-gold-dark': '#A8893A',
        'pm-burgundy': '#6B1D3A',
        'pm-cream': '#FFF8EE',
        'pm-text': '#2D2D2D',
        'pm-text-secondary': '#666666',
        'pm-surface': '#FFFFFF',
        'pm-border': '#E0E0E0',
        // Mode colors
        'mode-buy': '#2E7D32',
        'mode-whatsapp': '#25D366',
        'mode-visit': '#1976D2',
        // Status colors
        'pm-success': '#4CAF50',
        'pm-warning': '#FF9800',
        'pm-error': '#F44336',
        'pm-info': '#2196F3',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'pm-h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'pm-h2': ['2rem', { lineHeight: '1.3', fontWeight: '700' }],
        'pm-h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'pm-body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'pm-body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'pm-small': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'pm-tiny': ['0.75rem', { lineHeight: '1.3', fontWeight: '400' }],
        'pm-button': ['1rem', { lineHeight: '1', fontWeight: '600' }],
      },
      borderRadius: {
        'pm-sm': '4px',
        'pm-md': '8px',
        'pm-lg': '12px',
        'pm-xl': '16px',
        'pm-full': '9999px',
      },
      spacing: {
        'pm-1': '4px',
        'pm-2': '8px',
        'pm-3': '12px',
        'pm-4': '16px',
        'pm-5': '24px',
        'pm-6': '32px',
        'pm-8': '48px',
        'pm-10': '64px',
      },
      boxShadow: {
        'pm-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'pm-md': '0 4px 6px rgba(0,0,0,0.07)',
        'pm-lg': '0 10px 15px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'pulse-dot': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
