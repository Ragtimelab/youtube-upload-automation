/**
 * 공통 타입 정의
 * 프로젝트 전체에서 사용되는 기본적인 타입들을 중앙화
 */

// 기본 상태 타입들
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled'

// 업로드 상태 인터페이스
export interface UploadState {
  isUploading: boolean
  progress: number
  message: string
  status: UploadStatus
  error?: string
  currentStep?: number
  totalSteps?: number
  startTime?: Date | null
  endTime?: Date | null
  result?: unknown
}

// 업로드 상태 컬렉션
export interface UploadStates {
  [scriptId: number]: UploadState
}

// 배치 업로드 설정
export interface BatchSettings {
  delay: number
  privacy: 'private' | 'unlisted' | 'public'
  category: number
  publishAt: string
}

// 배치 진행 상태
export interface BatchProgress {
  current: number
  total: number
}

// 글로벌 통계
export interface GlobalStats {
  activeUploads: number
  completedToday: number
  errorCount: number
  successRate: number
}

// WebSocket 상태
export interface WebSocketState {
  isConnected: boolean
  connectionStatus: ConnectionStatus
  error?: string
  reconnectAttempts: number
  lastActivity?: Date
}

// 시스템 상태
export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'error'
  uptime: number
  version: string
  lastCheck: Date
}

// 성능 메트릭
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  trend?: 'up' | 'down' | 'stable'
  color?: string
}

// 알림 타입
export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// 페이지네이션
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

// API 응답 래퍼 타입들
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

// 폼 필드 상태
export interface FieldState {
  value: string
  error?: string
  touched: boolean
  valid: boolean
}

// 폼 상태
export interface FormState<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FieldState
  }
  isSubmitting: boolean
  isValid: boolean
  errors: Partial<Record<keyof T, string>>
}

// 선택 가능한 옵션
export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
  description?: string
}

// 테이블 컬럼 정의
export interface TableColumn<T = unknown> {
  key: keyof T | string
  title: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, item: T) => React.ReactNode
}

// 정렬 설정
export interface SortConfig<T = unknown> {
  key: keyof T | string
  direction: 'asc' | 'desc'
}

// 필터 설정
export interface FilterConfig<T = unknown> {
  key: keyof T | string
  value: unknown
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt'
}

// 차트 데이터 포인트
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
  percentage?: number
}

// 시계열 데이터
export interface TimeSeriesData {
  timestamp: Date
  value: number
  label?: string
}

// 색상 설정 타입
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 이벤트 핸들러 타입들
export type ChangeHandler<T = string> = (value: T) => void
export type ClickHandler = () => void
export type SubmitHandler<T = unknown> = (data: T) => void | Promise<void>

// 컴포넌트 Props 기본 타입들
export interface BaseProps {
  className?: string
  children?: React.ReactNode
}

export interface BaseButtonProps extends BaseProps {
  onClick?: ClickHandler
  disabled?: boolean
  loading?: boolean
  variant?: ColorVariant
  size?: SizeVariant
}

export interface BaseInputProps extends BaseProps {
  value?: string
  onChange?: ChangeHandler<string>
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
}