import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        neodym: {
          bg: '#020817',
          panel: '#0B1424',
          border: '#1E2B3F',
          blue: '#3478F6',
          glow: '#3B82F6',
          muted: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
