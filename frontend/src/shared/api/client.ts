import type { ApiResponse } from '@/shared/types'
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/shared/constants'

// API 클라이언트 클래스
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = REQUEST_TIMEOUT.DEFAULT, ...requestOptions } = options
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      // 응답이 JSON이 아닌 경우 처리
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError({
          message: data?.message || data || 'Request failed',
          status: response.status,
          code: data?.code,
          details: data?.details,
        })
      }

      return {
        success: true,
        data,
        message: data?.message,
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) {
        throw error
      }

      if (error?.name === 'AbortError') {
        throw new ApiError({
          message: 'Request timeout',
          code: 'TIMEOUT',
          status: 408,
        })
      }

      throw new ApiError({
        message: error?.message || 'Network error',
        code: 'NETWORK_ERROR',
        status: 0,
      })
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData 
        ? options?.headers 
        : { 'Content-Type': 'application/json', ...options?.headers },
    })
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // 파일 업로드용 메서드
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append(fieldName, file)
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: response,
              message: response?.message,
            })
          } else {
            reject(new ApiError({
              message: response?.message || 'Upload failed',
              status: xhr.status,
              code: response?.code,
              details: response?.details,
            }))
          }
        } catch (error) {
          reject(new ApiError({
            message: 'Invalid response format',
            status: xhr.status,
            code: 'PARSE_ERROR',
          }))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new ApiError({
          message: 'Upload failed',
          status: 0,
          code: 'NETWORK_ERROR',
        }))
      })

      xhr.addEventListener('timeout', () => {
        reject(new ApiError({
          message: 'Upload timeout',
          status: 408,
          code: 'TIMEOUT',
        }))
      })

      xhr.open('POST', `${this.baseURL}${endpoint}`)
      xhr.timeout = REQUEST_TIMEOUT.UPLOAD
      xhr.send(formData)
    })
  }
}

// API 에러 클래스
class ApiError extends Error {
  public status: number
  public code?: string
  public details?: Record<string, any>

  constructor({ message, status = 0, code, details }: {
    message: string
    status?: number
    code?: string
    details?: Record<string, any>
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// 기본 API 클라이언트 인스턴스
export const apiClient = new ApiClient()

export { ApiClient, ApiError }