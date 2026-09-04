import type { Config } from 'tailwindcss';

/**
 * Jetons repris tels quels des maquettes v1 (docs/maquettes-v1.html).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#221B22',
        paper: '#F6F1EA',
        'paper-2': '#EFE8DD',
        wine: '#7C2340',
        'wine-dark': '#5E1830',
        brass: '#B8935B',
        sage: '#4C6B54',
        grey: '#8B8189',
        line: '#DDD4C7',
        white: '#FFFDF9',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '14px', pill: '999px' },
    },
  },
  plugins: [],
};
export default config;
