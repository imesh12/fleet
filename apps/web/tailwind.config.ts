import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        active: 'rgb(var(--color-active) / <alpha-value>)',
        inactive: 'rgb(var(--color-inactive) / <alpha-value>)',
        maintenance: 'rgb(var(--color-maintenance) / <alpha-value>)',
        offline: 'rgb(var(--color-offline) / <alpha-value>)',
        stale: 'rgb(var(--color-stale) / <alpha-value>)',
        completed: 'rgb(var(--color-completed) / <alpha-value>)',
        cancelled: 'rgb(var(--color-cancelled) / <alpha-value>)',
        ink: '#172033',
        cream: '#f7f1e4',
        linen: '#fffaf0',
        ember: '#b65a2b',
        moss: '#496b55',
        amber: '#be7d25',
        sky: '#2a6f97',
        ash: '#d7cdbc',
        slateblue: '#334155',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Trebuchet MS', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        lift: 'var(--shadow-lift)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
};

export default config;
