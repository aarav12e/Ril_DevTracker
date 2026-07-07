export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#1a6b52',
          600: '#0D4F3C',
          700: '#0a3d2e',
          800: '#072d22',
          900: '#041e17',
        },
        gold: {
          100: '#fef9e7',
          200: '#fdf0c0',
          300: '#fae08a',
          400: '#C9A84C',
          500: '#b8932a',
          600: '#9a7a1e',
        },
        surface: '#F8F9FA',
        card: '#FFFFFF',
        border: '#E2E8F0',
        charcoal: '#1A1A2E',
        muted: '#64748B',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        card: '12px',
        btn: '24px',
        input: '8px',
      },
      animation: {
        'pulse-dot': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(20px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
