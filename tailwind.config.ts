import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'comuna-dark': '#070f0b',
        'comuna-card': 'rgba(13, 27, 20, 0.85)',
        'comuna-card-hover': 'rgba(22, 48, 35, 0.9)',
        'comuna-border': 'rgba(82, 183, 136, 0.2)',
        'comuna-border-hover': 'rgba(82, 183, 136, 0.5)',
        'primary': {
          DEFAULT: '#52b788',
          hover: '#74c69d',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#52b788',
          500: '#2d6a4f',
          600: '#1b4332',
          700: '#081c15',
        },
        'secondary': {
          DEFAULT: '#1b4332',
          dark: '#081c15',
        },
        'accent': {
          DEFAULT: '#ffb703',
          hover: '#ffc300',
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#ffb703',
          500: '#fb8500',
        },
        'text-main': '#f8f9fa',
        'text-muted': '#b7c4bb',
      },
      fontFamily: {
        sans: ["'Outfit'", "sans-serif"],
        display: ["'Pirata One'", "cursive"],
        pirata: ["'Pirata One'", "cursive"],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(82, 183, 136, 0.25)',
        'glow-hover': '0 0 25px rgba(82, 183, 136, 0.5)',
        'glow-gold': '0 0 20px rgba(255, 183, 3, 0.35)',
      },
      animation: {
        'shutter': 'shutterFlash 0.35s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shutterFlash: {
          '0%': { opacity: '0' },
          '40%': { opacity: '0.95', backgroundColor: '#ffffff' },
          '100%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
