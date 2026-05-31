import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'pm-primary': '#C8A45C',
        'pm-primary-dark': '#A8893A',
        'pm-secondary': '#6B1D3A',
        'pm-background': '#FFF8EE',
        'pm-surface': '#FFFFFF',
        'pm-text': '#2D2D2D',
        'pm-text-secondary': '#666666',
        'pm-mode-a': '#2E7D32',
        'pm-mode-b': '#25D366',
        'pm-mode-c': '#1976D2',
        'pm-success': '#4CAF50',
        'pm-warning': '#FF9800',
        'pm-error': '#F44336',
        'pm-border': '#E0E0E0',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
        '10': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'pm-sm': '0 1px 2px rgba(0,0,0,0.05)',
        'pm-md': '0 4px 6px rgba(0,0,0,0.07)',
        'pm-lg': '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
