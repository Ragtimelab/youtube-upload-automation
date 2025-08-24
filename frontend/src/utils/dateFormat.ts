/**
 * 날짜/시간 포맷팅 유틸리티 함수들
 * DRY 원칙에 따라 중복된 날짜 포맷팅 로직을 중앙화
 */

// 한국 로케일 상수
const KO_LOCALE = 'ko-KR' as const

// 시간 포맷 옵션
const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit'
} as const

/**
 * 한국 로케일 기준으로 시간만 포맷 (HH:mm)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(KO_LOCALE, TIME_FORMAT_OPTIONS)
}

/**
 * 한국 로케일 기준으로 전체 시간 포맷 (HH:mm:ss)
 */
export function formatFullTime(date: Date): string {
  return date.toLocaleTimeString(KO_LOCALE)
}

/**
 * 한국 로케일 기준으로 날짜만 포맷 (YYYY. M. D.)
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(KO_LOCALE)
}

/**
 * 한국 로케일 기준으로 날짜와 시간 모두 포맷 (YYYY. M. D. HH:mm:ss)
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(KO_LOCALE)
}

/**
 * ISO 8601 문자열을 한국 로케일 날짜로 변환
 */
export function formatISODate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(KO_LOCALE)
}

/**
 * ISO 8601 문자열을 한국 로케일 날짜시간으로 변환
 */
export function formatISODateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(KO_LOCALE)
}

/**
 * 현재 시간을 한국 로케일 시간 포맷으로 반환
 */
export function getCurrentTime(): string {
  return formatTime(new Date())
}

/**
 * 현재 날짜시간을 한국 로케일 포맷으로 반환
 */
export function getCurrentDateTime(): string {
  return formatDateTime(new Date())
}

/**
 * 파일 크기를 로케일 기준으로 포맷 (예: 1,024MB)
 */
export function formatFileSize(sizeInMB: number): string {
  return sizeInMB.toLocaleString()
}

// 타입 안전성을 위한 유틸리티 타입들
export type DateInput = Date | string
export type FormattedDate = string
export type FormattedTime = string
export type FormattedDateTime = string