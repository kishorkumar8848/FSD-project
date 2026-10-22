/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardLight: '#F1F5F9',
          border: '#E2E8F0',
          borderLight: '#CBD5E1',
          primary: '#1D68F0',
          primaryHover: '#1856C7',
          accent: '#3B82F6',
          muted: '#64748B',
          textMuted: '#64748B',
          textBright: '#0F172A',
        },
        severity: {
          critical: '#DC2626',
          criticalBg: '#FEF2F2',
          high: '#EA580C',
          highBg: '#FFF7ED',
          medium: '#D97706',
          mediumBg: '#FFFBEB',
          low: '#2563EB',
          lowBg: '#EFF6FF',
          info: '#64748B',
          infoBg: '#F8FAFC',
          success: '#16A34A',
          successBg: '#F0FDF4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
