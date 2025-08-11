import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  prefix: 'pf-', // Prefix to avoid conflicts when embedded
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--pf-border))',
        input: 'hsl(var(--pf-input))',
        ring: 'hsl(var(--pf-ring))',
        background: 'hsl(var(--pf-background))',
        foreground: 'hsl(var(--pf-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--pf-primary))',
          foreground: 'hsl(var(--pf-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--pf-secondary))',
          foreground: 'hsl(var(--pf-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--pf-destructive))',
          foreground: 'hsl(var(--pf-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--pf-muted))',
          foreground: 'hsl(var(--pf-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--pf-accent))',
          foreground: 'hsl(var(--pf-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--pf-popover))',
          foreground: 'hsl(var(--pf-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--pf-card))',
          foreground: 'hsl(var(--pf-card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--pf-radius)',
        md: 'calc(var(--pf-radius) - 2px)',
        sm: 'calc(var(--pf-radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      maxWidth: {
        'widget': '400px',
      },
      minWidth: {
        'widget': '320px',
      },
      zIndex: {
        'widget-trigger': '9998',
        'widget-container': '9999',
      },
    },
  },
  plugins: [animate],
}

export default config