// API 기본 설정
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// API 엔드포인트
export const API_ENDPOINTS = {
  // 스크립트 관리
  SCRIPTS: '/api/scripts',
  SCRIPT_UPLOAD: '/api/scripts/upload',
  SCRIPT_DETAIL: (id: string | number) => `/api/scripts/${id}`,
  SCRIPT_STATS: '/api/scripts/stats/summary',
  
  // 업로드 관리
  VIDEO_UPLOAD: (id: string | number) => `/api/upload/video/${id}`,
  YOUTUBE_UPLOAD: (id: string | number) => `/api/upload/youtube/${id}`,
  UPLOAD_STATUS: (id: string | number) => `/api/upload/status/${id}`,
  UPLOAD_PROGRESS: (id: string | number) => `/api/upload/progress/${id}`,
  VIDEO_DELETE: (id: string | number) => `/api/upload/video/${id}`,
  UPLOAD_HEALTH: '/api/upload/health',
  
  // 시스템
  HEALTH: '/health',
  ROOT: '/',
} as const

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

// API 에러 코드
export const API_ERROR_CODES = {
  SCRIPT_NOT_FOUND: 'SCRIPT_NOT_FOUND',
  SCRIPT_PARSING_ERROR: 'SCRIPT_PARSING_ERROR',
  FILE_VALIDATION_ERROR: 'FILE_VALIDATION_ERROR',
  INVALID_SCRIPT_STATUS: 'INVALID_SCRIPT_STATUS',
  YOUTUBE_AUTH_ERROR: 'YOUTUBE_AUTH_ERROR',
  YOUTUBE_UPLOAD_ERROR: 'YOUTUBE_UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

// 요청 타임아웃 (ms)
export const REQUEST_TIMEOUT = {
  DEFAULT: 30000, // 30초
  UPLOAD: 300000, // 5분
  LONG: 600000, // 10분
} as const