/**
 * API 응답 처리 및 에러 핸들링 유틸리티
 * 중복된 API 처리 로직을 중앙화
 */

// API 에러 타입 정의
export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

// API 성공 응답 타입
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp?: string
}

// API 에러 응답 타입
export interface ApiErrorResponse {
  success: false
  message: string
  error_code?: string
  timestamp?: string
}

// API 응답 통합 타입
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 에러 메시지 표준화 함수
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * API 에러 로깅 표준화 함수
 */
export function logApiError(context: string, error: unknown): void {
  const errorMessage = getErrorMessage(error)
  const timestamp = new Date().toISOString()
  
  console.error(`[API Error] ${context}:`, {
    message: errorMessage,
    timestamp,
    error
  })
}

/**
 * API 응답 검증 함수
 */
export function isApiSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * API 에러 응답 검증 함수
 */
export function isApiErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false
}

/**
 * API 호출 래퍼 함수 - 표준화된 에러 처리 포함
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await apiCall()
  } catch (error) {
    logApiError(context, error)
    return fallbackValue
  }
}

/**
 * YouTube API 할당량 에러 확인
 */
export function isQuotaError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('quota') || 
         message.includes('할당량') || 
         message.includes('limit exceeded')
}

/**
 * 네트워크 연결 에러 확인
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('network') || 
         message.includes('connection') || 
         message.includes('fetch')
}

/**
 * 파일 크기 검증 함수
 */
export function validateFileSize(file: File, maxSizeMB: number): { valid: boolean; error?: string } {
  const fileSizeMB = file.size / (1024 * 1024)
  
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `파일 크기가 ${maxSizeMB.toLocaleString()}MB를 초과합니다. 현재 크기: ${fileSizeMB.toFixed(1)}MB`
    }
  }
  
  return { valid: true }
}

/**
 * 파일 타입 검증 함수
 */
export function validateFileType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `지원되지 않는 파일 형식입니다. 지원 형식: ${allowedTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * 사용자 친화적 에러 메시지 변환
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const message = getErrorMessage(error)
  
  // YouTube API 에러 변환
  if (isQuotaError(error)) {
    return 'YouTube API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.'
  }
  
  // 네트워크 에러 변환
  if (isNetworkError(error)) {
    return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
  }
  
  // 일반적인 에러 패턴 변환
  const errorPatterns: Record<string, string> = {
    '400': '요청이 잘못되었습니다.',
    '401': '인증이 필요합니다.',
    '403': '접근 권한이 없습니다.',
    '404': '요청하신 리소스를 찾을 수 없습니다.',
    '429': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    '500': '서버에 오류가 발생했습니다.',
    'timeout': '요청 시간이 초과되었습니다.'
  }
  
  for (const [pattern, friendlyMessage] of Object.entries(errorPatterns)) {
    if (message.toLowerCase().includes(pattern)) {
      return friendlyMessage
    }
  }
  
  return message
}

// 타입 가드 함수들
export function hasErrorMessage(obj: unknown): obj is { message: string } {
  return typeof obj === 'object' && obj !== null && 'message' in obj
}

export function hasErrorCode(obj: unknown): obj is { code: string } {
  return typeof obj === 'object' && obj !== null && 'code' in obj
}