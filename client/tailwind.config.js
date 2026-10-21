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
          bg: '#0B1120',
          card: '#111827',
          cardLight: '#1E293B',
          border: '#1F2937',
          borderLight: '#334155',
          primary: '#3B82F6',
          primaryHover: '#2563EB',
          accent: '#60A5FA',
          muted: '#64748B',
          textMuted: '#94A3B8',
          textBright: '#F8FAFC',
        },
        severity: {
          critical: '#DC2626',
          criticalBg: 'rgba(220, 38, 38, 0.15)',
          high: '#EA580C',
          highBg: 'rgba(234, 88, 12, 0.15)',
          medium: '#D97706',
          mediumBg: 'rgba(217, 119, 6, 0.15)',
          low: '#2563EB',
          lowBg: 'rgba(37, 99, 235, 0.15)',
          info: '#64748B',
          infoBg: 'rgba(100, 116, 139, 0.15)',
          success: '#16A34A',
          successBg: 'rgba(22, 163, 74, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
