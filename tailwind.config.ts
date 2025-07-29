import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // TODO: Delete if not needed / configured elsewhere
    // spacing: {
    //   // Golden ratio spacing system
    //   'sp-5': 'calc(1rem / 1.618 / 1.618 / 1.618 / 1.618 / 1.618)', // ~0.090rem
    //   'sp-4': 'calc(1rem / 1.618 / 1.618 / 1.618 / 1.618)', // ~0.146rem
    //   'sp-3': 'calc(1rem / 1.618 / 1.618 / 1.618)', // ~0.236rem
    //   'sp-2': 'calc(1rem / 1.618 / 1.618)', // ~0.382rem
    //   'sp-1': 'calc(1rem / 1.618)', // ~0.618rem
    //   sp0: '1rem', // 1rem (base)
    //   sp1: 'calc(1rem * 1.618)', // ~1.618rem
    //   sp2: 'calc(1rem * 1.618 * 1.618)', // ~2.618rem
    //   sp3: 'calc(1rem * 1.618 * 1.618 * 1.618)', // ~4.236rem
    //   sp4: 'calc(1rem * 1.618 * 1.618 * 1.618 * 1.618)', // ~6.854rem
    //   sp5: 'calc(1rem * 1.618 * 1.618 * 1.618 * 1.618 * 1.618)', // ~11.089rem
    // },
    colors: {
      // Surface colors for light/dark mode
      surface: {
        light: 'hsl(40, 100%, 97%)',
        'light-alt': 'hsl(40, 100%, 100%)',
        dark: 'hsl(0, 0%, 11%)',
        'dark-alt': 'hsl(0, 0%, 14%)',
      },
      // Sunset-inspired color palette
      sunset: {
        gold: {
          100: 'hsla(36, 69%, 86%, 1)',
          150: 'hsla(37, 68%, 81%, 1)',
          200: 'hsla(37, 69%, 76%, 1)',
          300: 'hsla(37, 68%, 71%, 1)',
          400: 'hsla(36, 68%, 66%, 1)',
          500: 'hsla(36, 69%, 61%, 1)',
          600: 'hsla(37, 68%, 56%, 1)',
          DEFAULT: 'hsla(37, 68%, 71%, 1)',
          'op-75': 'hsla(37, 68%, 71%, 0.75)',
          'op-60': 'hsla(37, 68%, 71%, 0.6)',
          'op-40': 'hsla(37, 68%, 71%, 0.4)',
          'op-20': 'hsla(37, 68%, 71%, 0.2)',
          'op-09': 'hsla(37, 68%, 71%, 0.09)',
        },
      },
      buttery: {
        yellow: {
          DEFAULT: 'hsla(52, 97%, 85%, 1)',
          'op-75': 'hsla(52, 97%, 85%, 0.75)',
          'op-60': 'hsla(52, 97%, 85%, 0.6)',
          'op-40': 'hsla(52, 97%, 85%, 0.4)',
          'op-20': 'hsla(52, 97%, 85%, 0.2)',
          'op-09': 'hsla(52, 97%, 85%, 0.09)',
        },
      },
      sage: {
        green: {
          DEFAULT: 'hsla(98, 12%, 59%, 1)',
          'op-75': 'hsla(98, 12%, 59%, 0.75)',
          'op-60': 'hsla(98, 12%, 59%, 0.6)',
          'op-40': 'hsla(98, 12%, 59%, 0.4)',
          'op-20': 'hsla(98, 12%, 59%, 0.2)',
          'op-09': 'hsla(98, 12%, 59%, 0.09)',
        },
      },
      ocean: {
        midnight: {
          DEFAULT: 'hsla(249, 14%, 18%, 1)',
          'op-75': 'hsla(249, 14%, 18%, 0.75)',
          'op-60': 'hsla(249, 14%, 18%, 0.6)',
          'op-40': 'hsla(249, 14%, 18%, 0.4)',
          'op-20': 'hsla(249, 14%, 18%, 0.2)',
          'op-09': 'hsla(249, 14%, 18%, 0.09)',
        },
      },
      // Extended primary colors (keeping for compatibility)
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      serif: ['var(--font-playfair)', 'ui-serif', 'Georgia', 'serif'],
    },
    borderRadius: {
      xl: '1rem',
      '2xl': '1.5rem',
    },
    boxShadow: {
      soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      elegant: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-gentle': 'bounceGentle 2s infinite',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      bounceGentle: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-5px)' },
      },
    },
  },
  plugins: [],
};

export default config;
