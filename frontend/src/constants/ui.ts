// UI 관련 상수 중앙화
export const UI_CONSTANTS = {
  // 색상 팔레트
  COLORS: {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    secondary: '#6B7280',
    accent: '#8B5CF6',
    
    // 상태별 색상
    status: {
      healthy: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      processing: '#3B82F6'
    }
  },

  // 새로고침 및 폴링 간격
  INTERVALS: {
    LOG_REFRESH: 5000,          // 5초 - 로그 새로고침
    METRICS_REFRESH: 30000,     // 30초 - 메트릭 새로고침
    HEARTBEAT: 30000,           // 30초 - WebSocket 하트비트
    RECONNECT: 3000,            // 3초 - WebSocket 재연결
    ANIMATION: 2000             // 2초 - 애니메이션 주기
  },

  // 제한값들
  LIMITS: {
    MAX_LOGS: 50,               // 최대 로그 개수
    MAX_NOTIFICATIONS: 20,      // 최대 알림 개수
    MAX_TOAST_COUNT: 5,         // 최대 토스트 개수
    CHUNK_SIZE: 1024 * 1024,    // 1MB - 파일 청크 크기
    MAX_FILE_SIZE: 8 * 1024 * 1024 * 1024 // 8GB - 최대 파일 크기
  },

  // API 관련
  API: {
    TIMEOUT: 30000,             // 30초 - API 타임아웃
    BASE_URL: 'http://localhost:8000/api',
    WEBSOCKET_URL: 'ws://localhost:8000/ws/'
  },

  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },

  // 토스트 지속시간
  TOAST_DURATION: {
    default: 5000,
    success: 4000,
    error: 8000,
    warning: 6000,
    info: 5000
  }
}

// 반응형 브레이크포인트 (Tailwind 기준)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// 애니메이션 지속시간
export const ANIMATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms'
}