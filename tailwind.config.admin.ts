import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/admin/**/*.{js,ts,jsx,tsx}',
    './src/admin/**/*.tsx',
    './admin.html',
  ],
  // No prefix for admin panel
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
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#2563eb',
        background: '#ffffff',
        foreground: '#0f172a',
        secondary: '#64748b',
        muted: '#f8fafc',
        accent: '#06b6d4',
        destructive: '#ef4444',
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [animate],
}

export default config