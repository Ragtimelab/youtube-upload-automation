import { ApiResponse } from '@/types'

// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동 설정)
    if (options.body instanceof FormData) {
      delete (config.headers as Record<string, string>)['Content-Type']
    }

    try {
      const response = await fetch(url, config)
      
      // HTTP 상태 코드 확인
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || errorData.detail || `HTTP ${response.status}`,
          response.status,
          errorData.code
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // 네트워크 오류 등
      throw new ApiError('네트워크 오류가 발생했습니다.', 0, 'NETWORK_ERROR')
    }
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST 요청 (JSON)
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // POST 요청 (FormData)
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }

  // PUT 요청
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// API 클라이언트 인스턴스
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
)

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  // 헬스체크
  HEALTH: '/health',
  
  // 대본 관리
  SCRIPTS: '/api/scripts',
  SCRIPT_UPLOAD: '/api/scripts/upload',
  SCRIPT_DETAIL: (id: number) => `/api/scripts/${id}`,
  
  // 비디오 업로드
  VIDEO_UPLOAD: (id: number) => `/api/upload/video/${id}`,
  YOUTUBE_UPLOAD: (id: number) => `/api/upload/youtube/${id}`,
  UPLOAD_STATUS: (id: number) => `/api/upload/status/${id}`,
  VIDEO_DELETE: (id: number) => `/api/upload/video/${id}`,
} as const