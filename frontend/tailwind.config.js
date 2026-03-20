/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#050a14', 900: '#0a0f1e', 800: '#0d1530', 700: '#111d3d', 600: '#162247' },
        electric: { 500: '#0066ff', 400: '#2980ff', 300: '#5599ff', 200: '#80b3ff', 100: '#b3d0ff' },
        amber: { 600: '#d97706', 500: '#f59e0b', 400: '#fbbf24', 300: '#fcd34d' },
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
        violet: { 400: '#a78bfa', 500: '#8b5cf6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #0a0f1e 0%, #0d1530 50%, #0a0f1e 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.3)',
        'glow-blue-lg': '0 0 40px rgba(0, 102, 255, 0.4)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 102, 255, 0.1)',
      },
      animation: {
        'truck-drive': 'truckDrive 8s linear infinite',
        'road-dash': 'roadDash 0.8s linear infinite',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bar-grow': 'barGrow 1s ease-out forwards',
        'count-up': 'countUp 0.6s ease-out',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient-x': 'gradientX 3s ease infinite',
      },
      keyframes: {
        truckDrive: {
          '0%': { transform: 'translateX(-250px)' },
          '100%': { transform: 'translateX(110vw)' }
        },
        roadDash: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-60px)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 102, 255, 0.6), 0 0 80px rgba(0, 102, 255, 0.2)' }
        },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceGentle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        barGrow: { '0%': { width: '0%' }, '100%': { width: 'var(--bar-width)' } },
        countUp: { '0%': { opacity: '0', transform: 'translateY(10px) scale(0.9)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        gradientX: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        gradientShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
      },
    },
  },
  plugins: [],
}
