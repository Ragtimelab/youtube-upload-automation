// API 응답 공통 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API 에러 타입
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// HTTP 메서드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API 상태 타입
export interface ApiState {
  loading: boolean
  error: ApiError | null
  data: any
}