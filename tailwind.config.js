/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#ff6b1a',
          'orange-dim': '#cc5514',
          'orange-glow': 'rgba(255, 107, 26, 0.12)',
          'orange-border': 'rgba(255, 107, 26, 0.25)',
        },
        surface: {
          bg: '#0c0c14',
          card: '#111118',
          elevated: '#18181f',
          hover: '#1e1e28',
          border: '#1e1e2e',
          'border-bright': '#2e2e42',
        },
        ink: {
          DEFAULT: '#f0f0f8',
          secondary: '#8888aa',
          muted: '#555568',
          faint: '#333348',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 26, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255, 107, 26, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}
