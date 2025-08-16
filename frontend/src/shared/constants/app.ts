// 앱 메타데이터
export const APP_CONFIG = {
  NAME: 'YouTube Upload Automation',
  DESCRIPTION: 'Korean Senior Content Upload System',
  VERSION: '1.0.0',
} as const

// 파일 업로드 제한
export const UPLOAD_LIMITS = {
  SCRIPT_FILE: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_TYPES: ['.txt'],
    MIME_TYPES: ['text/plain'],
  },
  VIDEO_FILE: {
    MAX_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
    ALLOWED_TYPES: ['.mp4', '.avi', '.mov', '.mkv'],
    MIME_TYPES: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'],
  },
} as const

// 업로드 상태 라벨
export const STATUS_LABELS = {
  script_ready: '대본 준비완료',
  video_ready: '비디오 준비완료', 
  uploaded: '업로드 완료',
  scheduled: '예약 발행',
  error: '오류',
} as const

// 업로드 상태 색상
export const STATUS_COLORS = {
  script_ready: 'bg-blue-100 text-blue-800',
  video_ready: 'bg-yellow-100 text-yellow-800',
  uploaded: 'bg-green-100 text-green-800',
  scheduled: 'bg-purple-100 text-purple-800',
  error: 'bg-red-100 text-red-800',
} as const

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const

// 알림 설정
export const NOTIFICATION = {
  DURATION: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 7000,
  },
  MAX_NOTIFICATIONS: 5,
} as const

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  THEME: 'youtube-automation-theme',
  SETTINGS: 'youtube-automation-settings',
  AUTH_TOKEN: 'youtube-automation-token',
} as const

// 라우트 경로
export const ROUTES = {
  DASHBOARD: '/',
  SCRIPT_UPLOAD: '/upload',
  SCRIPT_MANAGEMENT: '/manage',
  VIDEO_UPLOAD: '/video-upload',
  SETTINGS: '/settings',
  SCRIPT_DETAIL: '/scripts',
} as const