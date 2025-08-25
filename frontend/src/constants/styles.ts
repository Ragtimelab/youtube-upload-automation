// 공통 스타일 패턴 중앙화
// Tailwind CSS 클래스 하드코딩 제거를 위한 상수 시스템

export const COMMON_STYLES = {
  // 카드 스타일 (가장 많이 사용되는 패턴)
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardHeader: 'p-6 border-b border-gray-200',
  cardContent: 'p-6',
  cardContentSpaced: 'p-6 space-y-4',

  // 버튼 스타일 변형
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-md transition-colors',
    danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors',
    outline: 'border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-sm transition-colors',
    outlineSmall: 'px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'
  },

  // 입력 필드 스타일
  input: {
    default: 'px-3 py-2 border border-gray-300 rounded-md text-sm',
    select: 'px-3 py-2 border border-gray-300 rounded-md text-sm',
    search: 'flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500'
  },

  // 아이콘 컨테이너 스타일
  iconContainer: {
    default: 'flex items-center space-x-3',
    small: 'flex items-center space-x-2',
    large: 'flex items-center space-x-4'
  },

  // 상태별 인디케이터
  indicator: {
    online: 'w-2 h-2 bg-green-500 rounded-full',
    offline: 'w-2 h-2 bg-red-500 rounded-full',
    warning: 'w-2 h-2 bg-yellow-500 rounded-full'
  },

  // 토글 스위치 (설정 페이지용)
  toggle: {
    container: 'relative inline-flex items-center cursor-pointer',
    switch: 'w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600',
    hiddenInput: 'sr-only peer'
  },

  // 제목 및 텍스트 스타일
  text: {
    pageTitle: 'text-2xl font-bold text-gray-900',
    pageDescription: 'text-gray-600 mt-1',
    sectionTitle: 'text-lg font-medium text-gray-900',
    cardTitle: 'font-medium text-gray-900',
    cardDescription: 'text-sm text-gray-600',
    label: 'text-sm text-gray-500',
    small: 'text-xs',
    success: 'text-sm text-green-600',
    error: 'text-sm text-red-600',
    warning: 'text-sm text-yellow-600'
  }
} as const

// 컴포넌트별 특화 스타일
export const COMPONENT_STYLES = {
  // 모달 및 오버레이
  modal: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    content: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4'
  },

  // 툴팁
  tooltip: {
    container: 'absolute z-10 px-2 py-1 text-sm bg-gray-800 text-white rounded shadow-lg',
    arrow: 'absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800'
  },

  // 배지 (상태 표시용)
  badge: {
    success: 'px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium',
    error: 'px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium',
    warning: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium',
    info: 'px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium',
    neutral: 'px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-medium'
  },

  // 프로그레스 바
  progress: {
    container: 'w-full bg-gray-200 rounded-full h-2',
    bar: 'bg-blue-600 h-2 rounded-full transition-all duration-300'
  }
} as const

// 레이아웃 관련 스타일
export const LAYOUT_STYLES = {
  // 그리드 레이아웃
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cards: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    systemInfo: 'grid grid-cols-1 md:grid-cols-2 gap-4'
  },

  // Flexbox 패턴
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center',
    wrap: 'flex flex-wrap',
    spaceBetween: 'flex items-center justify-between'
  },

  // 간격 (spacing)
  spacing: {
    section: 'space-y-6',
    cardContent: 'space-y-4',
    small: 'space-y-2',
    large: 'space-y-8'
  },

  // 컨테이너
  container: {
    main: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    centered: 'max-w-2xl mx-auto',
    page: 'min-h-screen bg-gray-50'
  }
} as const

// 타입 안전성을 위한 유틸리티
export type CommonStyleKey = keyof typeof COMMON_STYLES
export type ComponentStyleKey = keyof typeof COMPONENT_STYLES
export type LayoutStyleKey = keyof typeof LAYOUT_STYLES

// 스타일 결합 헬퍼 함수
export const combineStyles = (...styles: (string | undefined)[]): string => {
  return styles.filter(Boolean).join(' ')
}

// 조건부 스타일 헬퍼 함수
export const conditionalStyle = (condition: boolean, trueStyle: string, falseStyle = ''): string => {
  return condition ? trueStyle : falseStyle
}