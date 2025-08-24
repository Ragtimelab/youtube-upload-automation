/**
 * CSS 클래스명 유틸리티 함수들
 * 중복된 CSS 패턴을 중앙화하여 일관성 유지
 */

// 공통 레이아웃 클래스들
export const commonLayouts = {
  // Flex 레이아웃 패턴들
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',
  
  // Gap 패턴들
  gapSm: 'gap-2',
  gapMd: 'gap-4',
  gapLg: 'gap-6',
  gapXl: 'gap-8',
  
  // 자주 사용되는 조합들
  flexGapSm: 'flex items-center gap-2',
  flexGapMd: 'flex items-center gap-4',
  flexGapLg: 'flex items-center gap-6',
  
  // 그리드 패턴들
  gridCols1: 'grid grid-cols-1',
  gridCols2: 'grid grid-cols-1 md:grid-cols-2',
  gridCols3: 'grid grid-cols-1 md:grid-cols-3',
  gridCols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  gridCols5: 'grid grid-cols-2 md:grid-cols-5',
  
  // 반응형 패딩/마진
  padding: 'p-4 md:p-6 lg:p-8',
  margin: 'm-4 md:m-6 lg:m-8',
  
  // 카드 스타일
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardPadding: 'p-4 md:p-6',
  
  // 전체 화면 레이아웃
  fullScreen: 'min-h-screen bg-gray-50',
  container: 'max-w-7xl mx-auto',
  
  // 텍스트 스타일
  title: 'text-3xl font-bold text-gray-900',
  subtitle: 'text-gray-600',
  smallText: 'text-sm text-gray-500',
} as const

// 상태별 색상 패턴들
export const statusColors = {
  success: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800'
  },
  error: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800'
  },
  warning: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  info: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  gray: {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800'
  },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800'
  }
} as const

// 애니메이션 패턴들
export const animations = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  fadeIn: 'transition-opacity duration-200 ease-in-out',
  slideIn: 'transition-transform duration-200 ease-in-out',
  hover: 'transition-colors duration-200 hover:bg-gray-50'
} as const

/**
 * 조건부 클래스명 생성 유틸리티
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 상태에 따른 색상 클래스 반환
 */
export function getStatusColor(status: string, type: 'text' | 'bg' | 'border' | 'badge' = 'text'): string {
  const colorMap = statusColors[status as keyof typeof statusColors] || statusColors.gray
  return colorMap[type]
}

/**
 * 아이콘과 텍스트 조합을 위한 공통 클래스
 */
export function iconWithText(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizeMap = {
    sm: 'h-4 w-4 mr-2',
    md: 'h-5 w-5 mr-2',
    lg: 'h-6 w-6 mr-2'
  }
  return sizeMap[size]
}

/**
 * 메트릭 카드를 위한 공통 스타일
 */
export function metricCard(color: keyof typeof statusColors): string {
  return cn(
    commonLayouts.card,
    statusColors[color].bg,
    statusColors[color].border,
    'border'
  )
}

// 타입 안전성을 위한 유틸리티 타입들
export type StatusColor = keyof typeof statusColors
export type ColorType = 'text' | 'bg' | 'border' | 'badge'
export type IconSize = 'sm' | 'md' | 'lg'