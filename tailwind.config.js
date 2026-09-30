/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#24315E',
        paper: '#FFFDF8',
        mint: { DEFAULT: '#34C3AE', deep: '#1F9C89' },
        sun: { DEFAULT: '#FFC83D', deep: '#F2A516' },
        coral: '#FF7A6B',
        grape: '#8A6CF0',
        cloud: '#EEF5FF',
      },
      fontFamily: {
        display: ['Jua', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
        body: ['"Gowun Dodum"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3.5%)' },
        },
        squash: {
          '0%': { transform: 'scale(1,1)' },
          '18%': { transform: 'scale(1.2,0.8) translateY(8%)' },
          '42%': { transform: 'scale(0.9,1.12) translateY(-12%)' },
          '68%': { transform: 'scale(1.05,0.96) translateY(0)' },
          '100%': { transform: 'scale(1,1)' },
        },
        jiggle: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        'ball-in': {
          '0%': { transform: 'translateY(-60%) scale(0.3)', opacity: '0' },
          '55%': { transform: 'translateY(4%) scale(1.06, 0.94)', opacity: '1' },
          '80%': { transform: 'translateY(-2%) scale(0.98, 1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'half-top': {
          '0%': { transform: 'translate(0,0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translate(-55%,-80%) rotate(-55deg)', opacity: '0' },
        },
        'half-bottom': {
          '0%': { transform: 'translate(0,0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translate(55%,70%) rotate(40deg)', opacity: '0' },
        },
        particle: {
          '0%': { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: '1' },
          '100%': {
            transform: 'translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3) rotate(var(--rot))',
            opacity: '0',
          },
        },
        'card-in': {
          '0%': { transform: 'scale(0.15) rotate(-10deg)', opacity: '0' },
          '60%': { transform: 'scale(1.06) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        'card-out': {
          '0%': { transform: 'translateX(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateX(130%) rotate(20deg)', opacity: '0' },
        },
        speak: {
          '0%,100%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.12)' },
          '65%': { transform: 'scale(0.97)' },
        },
        twinkle: {
          '0%,100%': { transform: 'scale(0.6) rotate(0)', opacity: '0.4' },
          '50%': { transform: 'scale(1) rotate(20deg)', opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translateX(-12vw)' },
          '100%': { transform: 'translateX(12vw)' },
        },
        nudge: {
          '0%,100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(25%)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        floaty: 'floaty 2.8s ease-in-out infinite',
        squash: 'squash 420ms cubic-bezier(.3,.7,.4,1.2)',
        jiggle: 'jiggle 260ms ease-in-out infinite',
        'ball-in': 'ball-in 560ms cubic-bezier(.3,.8,.4,1) both',
        'half-top': 'half-top 620ms cubic-bezier(.2,.7,.4,1) forwards',
        'half-bottom': 'half-bottom 620ms cubic-bezier(.2,.7,.4,1) forwards',
        particle: 'particle 900ms cubic-bezier(.15,.7,.35,1) forwards',
        'card-in': 'card-in 620ms cubic-bezier(.3,.8,.4,1.1) both',
        'card-out': 'card-out 600ms cubic-bezier(.5,0,.8,.4) forwards',
        speak: 'speak 650ms ease-in-out infinite',
        twinkle: 'twinkle 1.8s ease-in-out infinite',
        drift: 'drift 26s ease-in-out infinite alternate',
        nudge: 'nudge 1s ease-in-out infinite',
        shake: 'shake 400ms ease-in-out',
      },
    },
  },
  plugins: [],
}
