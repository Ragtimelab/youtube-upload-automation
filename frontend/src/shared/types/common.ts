// 공통 유틸리티 타입
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Nullable<T> = T | null

export type Maybe<T> = T | undefined

// ID 타입
export type ID = string | number

// 상태 타입
export type Status = 'idle' | 'loading' | 'success' | 'error'

// 업로드 상태 타입
export type UploadStatus = 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error'

// 날짜 관련 타입
export type DateString = string
export type Timestamp = number

// 파일 관련 타입
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

// 진행률 타입
export interface Progress {
  current: number
  total: number
  percentage: number
  message?: string
}

// 알림 타입
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// 테마 타입
export type Theme = 'light' | 'dark' | 'system'

// 반응형 브레이크포인트
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'