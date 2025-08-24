/**
 * TypeScript 타입 가드 유틸리티
 * TS2339 에러 근본 해결을 위한 타입 안전성 보장
 */

// Axios 에러 타입 가드
export interface AxiosError {
  message: string
  response?: {
    status: number
    data?: {
      error?: {
        reason?: string
        message?: string
      }
      message?: string
    }
  }
  code?: string
}

// 일반 에러 타입 가드
export interface StandardError {
  message: string
  code?: string
}

/**
 * Axios 에러인지 확인하는 타입 가드
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AxiosError).message === 'string'
  )
}

/**
 * 표준 에러 객체인지 확인하는 타입 가드
 */
export function isStandardError(error: unknown): error is StandardError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as StandardError).message === 'string'
  )
}

/**
 * 에러에서 메시지 추출 (타입 안전)
 */
export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.error?.message || 
           error.response?.data?.message || 
           error.message || 
           '알 수 없는 Axios 오류'
  }
  
  if (isStandardError(error)) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return '알 수 없는 오류가 발생했습니다'
}

/**
 * HTTP 상태 코드 추출 (타입 안전)
 */
export function extractStatusCode(error: unknown): number | null {
  if (isAxiosError(error) && error.response?.status) {
    return error.response.status
  }
  return null
}

/**
 * 에러 코드 추출 (타입 안전)
 */
export function extractErrorCode(error: unknown): string | null {
  if (isAxiosError(error) && error.code) {
    return error.code
  }
  
  if (isStandardError(error) && error.code) {
    return error.code
  }
  
  return null
}

/**
 * YouTube API 전용 에러 정보 추출
 */
export function extractYouTubeErrorInfo(error: unknown): {
  reason: string | null
  message: string
  status: number | null
} {
  if (isAxiosError(error)) {
    const reason = error.response?.data?.error?.reason || null
    const message = extractErrorMessage(error)
    const status = extractStatusCode(error)
    
    return { reason, message, status }
  }
  
  return {
    reason: null,
    message: extractErrorMessage(error),
    status: null
  }
}

// Performance API 타입 가드
export interface PerformanceEntryWithValue extends PerformanceEntry {
  value: number
  hadRecentInput?: boolean
}

export interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart: number
}

/**
 * Layout Shift 엔트리인지 확인하는 타입 가드
 */
export function isLayoutShiftEntry(entry: PerformanceEntry): entry is PerformanceEntryWithValue {
  return (
    entry.entryType === 'layout-shift' &&
    'value' in entry &&
    typeof (entry as PerformanceEntryWithValue).value === 'number'
  )
}

/**
 * First Input Delay 엔트리인지 확인하는 타입 가드
 */
export function isFirstInputEntry(entry: PerformanceEntry): entry is PerformanceEntryWithProcessing {
  return (
    entry.entryType === 'first-input' &&
    'processingStart' in entry &&
    typeof (entry as PerformanceEntryWithProcessing).processingStart === 'number'
  )
}

/**
 * 브라우저 메모리 정보 타입 가드
 */
export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export function hasMemoryInfo(performance: Performance): performance is Performance & { memory: MemoryInfo } {
  return (
    'memory' in performance &&
    typeof (performance as Performance & { memory?: MemoryInfo }).memory === 'object' &&
    (performance as Performance & { memory?: MemoryInfo }).memory !== null
  )
}