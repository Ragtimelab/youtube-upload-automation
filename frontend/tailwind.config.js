/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Phase 6: 반응형 디자인 + 접근성 확장 설정
    screens: {
      'xs': '475px',    // 작은 모바일
      'sm': '640px',    // 모바일
      'md': '768px',    // 태블릿
      'lg': '1024px',   // 데스크톱
      'xl': '1280px',   // 큰 데스크톱
      '2xl': '1536px',  // 매우 큰 화면
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 접근성 색상 추가 (WCAG AA 기준 대비율 보장)
        accessible: {
          'blue-light': '#0066CC',    // 4.5:1 대비율
          'blue-dark': '#003D7A',     // 7:1 대비율
          'green-light': '#007A33',   // 4.5:1 대비율
          'green-dark': '#004D1F',    // 7:1 대비율
          'red-light': '#CC0000',     // 4.5:1 대비율
          'red-dark': '#800000',      // 7:1 대비율
          'gray-light': '#767676',    // 4.5:1 대비율
          'gray-dark': '#424242',     // 7:1 대비율
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 터치 영역 최소 크기 (WCAG 2.1 AA 기준)
      minHeight: {
        'touch': '44px',
        'touch-comfortable': '48px',
        'touch-large': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-comfortable': '48px',
        'touch-large': '56px',
      },
      // 반응형 스페이싱
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 접근성 포커스 링
      ringWidth: {
        'focus': '3px',
      },
      ringColor: {
        'focus': '#0066CC',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
      // 읽기 쉬운 폰트 크기
      fontSize: {
        'xs-readable': ['13px', { lineHeight: '1.5' }],
        'sm-readable': ['15px', { lineHeight: '1.5' }],
        'base-readable': ['17px', { lineHeight: '1.5' }],
        'lg-readable': ['19px', { lineHeight: '1.5' }],
      },
      // 애니메이션 (접근성 고려)
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-up': 'scale-up 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // 반응형 그리드
      gridTemplateColumns: {
        'responsive-cards': 'repeat(auto-fit, minmax(300px, 1fr))',
        'responsive-dashboard': 'repeat(auto-fit, minmax(250px, 1fr))',
        'responsive-table': 'repeat(auto-fit, minmax(150px, 1fr))',
      },
    },
  },
  plugins: [
    // 접근성 플러그인 (커스텀)
    function({ addUtilities, theme }) {
      const newUtilities = {
        // 스크린 리더 전용
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        // 포커스 시에만 보이는 요소
        '.focus\\:not-sr-only:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        // 터치 영역 확장
        '.touch-area': {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            bottom: '-8px',
            left: '-8px',
            zIndex: '-1',
          }
        },
        // 접근성 포커스 링 (표준)
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            ringWidth: theme('ringWidth.focus'),
            ringColor: theme('ringColor.focus'),
            ringOffsetWidth: theme('ringOffsetWidth.focus'),
          }
        },
        // 고대비 모드 대응
        '.high-contrast': {
          '@media (prefers-contrast: high)': {
            borderWidth: '2px',
            borderColor: 'black',
          }
        },
        // 모션 감소 대응
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            // 애니메이션 적용
          }
        },
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          }
        },
      }
      addUtilities(newUtilities)
    }
  ],
}