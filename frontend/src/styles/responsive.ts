/**
 * 반응형 디자인 시스템
 * 모바일 우선 설계 + WCAG 터치 영역 기준 준수
 */

// Breakpoint 시스템 (Tailwind 확장)
export const breakpoints = {
  xs: '475px',    // 작은 모바일
  sm: '640px',    // 모바일
  md: '768px',    // 태블릿
  lg: '1024px',   // 데스크톱
  xl: '1280px',   // 큰 데스크톱
  '2xl': '1536px' // 매우 큰 화면
} as const

// 터치 영역 최소 크기 (WCAG 2.1 AA 기준)
export const touchTargets = {
  minimum: '44px',   // 최소 44x44px
  comfortable: '48px', // 편안한 크기
  large: '56px'      // 큰 터치 영역
} as const

// 스페이싱 시스템 (모바일/데스크톱)
export const spacing = {
  mobile: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    '2xl': '3rem'  // 48px
  },
  desktop: {
    xs: '0.75rem', // 12px
    sm: '1rem',    // 16px
    md: '1.5rem',  // 24px
    lg: '2rem',    // 32px
    xl: '3rem',    // 48px
    '2xl': '4rem'  // 64px
  }
} as const

// 타이포그래피 (반응형)
export const typography = {
  mobile: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl'   // 30px
  },
  desktop: {
    xs: 'text-sm',      // 14px
    sm: 'text-base',    // 16px
    base: 'text-lg',    // 18px
    lg: 'text-xl',      // 20px
    xl: 'text-2xl',     // 24px
    '2xl': 'text-3xl',  // 30px
    '3xl': 'text-4xl'   // 36px
  }
} as const

// 그리드 시스템 (페이지별 최적화)
export const gridLayouts = {
  // 스크립트 목록 (카드 그리드)
  scriptGrid: {
    mobile: 'grid-cols-1',           // 1열
    tablet: 'md:grid-cols-2',        // 2열
    desktop: 'lg:grid-cols-3'        // 3열
  },
  
  // 대시보드 (통계 카드)
  dashboardGrid: {
    mobile: 'grid-cols-1',           // 1열
    tablet: 'md:grid-cols-2',        // 2열
    desktop: 'lg:grid-cols-4'        // 4열
  },
  
  // 업로드 페이지 (폼 레이아웃)
  uploadLayout: {
    mobile: 'flex-col',              // 세로 배치
    tablet: 'md:flex-row',           // 가로 배치
    sidebar: 'md:w-1/3',             // 사이드바 1/3
    content: 'md:w-2/3'              // 메인 2/3
  },
  
  // YouTube 관리 (테이블 + 카드)
  youtubeLayout: {
    mobile: 'block',                 // 카드 형태
    desktop: 'lg:table'              // 테이블 형태
  }
} as const

// 컨테이너 최대 너비
export const containers = {
  sm: 'max-w-sm',    // 384px
  md: 'max-w-md',    // 448px
  lg: 'max-w-lg',    // 512px
  xl: 'max-w-xl',    // 576px
  '2xl': 'max-w-2xl', // 672px
  '3xl': 'max-w-3xl', // 768px
  '4xl': 'max-w-4xl', // 896px
  '5xl': 'max-w-5xl', // 1024px
  '6xl': 'max-w-6xl', // 1152px
  '7xl': 'max-w-7xl'  // 1280px
} as const

// 반응형 유틸리티 함수들
export const responsive = {
  // 클래스 조합 헬퍼
  combine: (...classes: (string | undefined | false)[]): string => {
    return classes.filter(Boolean).join(' ')
  },

  // 브레이크포인트별 클래스 생성
  breakpoint: (base: string, sm?: string, md?: string, lg?: string, xl?: string): string => {
    return responsive.combine(
      base,
      sm && `sm:${sm}`,
      md && `md:${md}`,
      lg && `lg:${lg}`,
      xl && `xl:${xl}`
    )
  },

  // 패딩 (모바일/데스크톱 반응형)
  padding: {
    page: 'p-4 md:p-6 lg:p-8',
    card: 'p-4 md:p-6',
    button: 'px-4 py-2 md:px-6 md:py-3',
    input: 'px-3 py-2 md:px-4 md:py-3'
  },

  // 마진 (반응형)
  margin: {
    section: 'mb-6 md:mb-8 lg:mb-12',
    card: 'mb-4 md:mb-6',
    button: 'mr-2 mb-2 md:mr-3 md:mb-0'
  },

  // 텍스트 크기 (반응형)
  text: {
    heading1: 'text-2xl md:text-3xl lg:text-4xl font-bold',
    heading2: 'text-xl md:text-2xl lg:text-3xl font-semibold',
    heading3: 'text-lg md:text-xl lg:text-2xl font-medium',
    body: 'text-sm md:text-base',
    caption: 'text-xs md:text-sm text-gray-600'
  },

  // 간격 (반응형)
  gap: {
    xs: 'gap-2 md:gap-3',
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12'
  }
} as const

// 모바일 전용 스타일
export const mobileOnly = {
  // 하단 네비게이션 (모바일)
  bottomNav: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden',
  
  // 모바일 드로어
  drawer: 'fixed inset-0 z-50 bg-white transform transition-transform md:hidden',
  
  // 모바일 툴바
  toolbar: 'sticky top-0 bg-white border-b border-gray-200 z-10 md:hidden',
  
  // 모바일 카드 스택
  cardStack: 'space-y-4 md:space-y-0 md:grid',
  
  // 터치 친화적 버튼
  touchButton: `min-h-[${touchTargets.minimum}] min-w-[${touchTargets.minimum}] touch-manipulation`
} as const

// 데스크톱 전용 스타일
export const desktopOnly = {
  // 사이드바
  sidebar: 'hidden md:block w-64 bg-gray-50 border-r border-gray-200',
  
  // 데스크톱 네비게이션
  topNav: 'hidden md:flex items-center space-x-4',
  
  // 데스크톱 툴팁
  tooltip: 'hidden md:block absolute z-10 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg',
  
  // 마우스 호버 효과
  hover: 'md:hover:bg-gray-100 md:hover:shadow-md transition-all duration-200'
} as const

// 접근성 고려 반응형 스타일
export const accessibility = {
  // 포커스 링 (터치/마우스 구분)
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  
  // 터치 영역 확장
  touchArea: `p-2 -m-2 min-h-[${touchTargets.minimum}] min-w-[${touchTargets.minimum}]`,
  
  // 읽기 쉬운 텍스트 대비
  textContrast: 'text-gray-900 dark:text-gray-100',
  
  // 모션 감소 대응
  reducedMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
  
  // 고대비 모드
  highContrast: 'contrast-more:border-2 contrast-more:border-black'
} as const

// 미디어 쿼리 JavaScript 헬퍼
export const mediaQueries = {
  isMobile: () => window.matchMedia(`(max-width: ${breakpoints.sm})`).matches,
  isTablet: () => window.matchMedia(`(min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.lg})`).matches,
  isDesktop: () => window.matchMedia(`(min-width: ${breakpoints.lg})`).matches,
  
  // 사용자 설정 감지
  prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  prefersHighContrast: () => window.matchMedia('(prefers-contrast: high)').matches,
  prefersDarkMode: () => window.matchMedia('(prefers-color-scheme: dark)').matches
} as const