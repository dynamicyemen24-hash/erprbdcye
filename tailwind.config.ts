import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          dark: 'var(--brand-dark-bg)',
          light: 'var(--brand-light-bg)',
        },
      },
      zIndex: {
        base: '0',
        sticky: '10',
        dropdown: '20',
        popover: '30',
        tooltip: '40',
        drawer: '50',
        dialog: '60',
        command: '70',
        critical: '80',
      },
    },
  },
  plugins: [],
};

export default config;
