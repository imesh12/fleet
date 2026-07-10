import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        cream: '#f7f1e4',
        linen: '#fffaf0',
        ember: '#b65a2b',
        moss: '#496b55',
        slateblue: '#334155',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Trebuchet MS', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 24px 80px rgba(23, 32, 51, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
