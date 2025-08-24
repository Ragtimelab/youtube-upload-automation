import axios from 'axios'
import type { 
  ApiResponse, 
  Script, 
  PaginatedResponse,
  UploadProgress,
  YouTubeUploadStatus 
} from '@/types/api'
import { UI_CONSTANTS } from '@/constants/ui'

// Axios 인스턴스 설정 - 비즈니스 로직 API용
const api = axios.create({
  baseURL: UI_CONSTANTS.API.BASE_URL,
  timeout: UI_CONSTANTS.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 인프라성 API용 별도 인스턴스 (prefix 없음)
const infraApi = axios.create({
  baseURL: UI_CONSTANTS.API.BASE_URL.replace('/api', ''),
  timeout: UI_CONSTANTS.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 응답 인터셉터로 에러 처리 - 비즈니스 API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Business API Error:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터로 에러 처리 - 인프라 API
infraApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Infrastructure API Error:', error)
    return Promise.reject(error)
  }
)

// 스크립트 API
export const scriptApi = {
  // 스크립트 목록 조회
  async getScripts(page = 1, perPage = 10): Promise<PaginatedResponse<Script>> {
    const response = await api.get<ApiResponse<Script[]>>('/scripts/', {
      params: { page, per_page: perPage }
    })
    
    // 백엔드 응답 구조에 맞게 변환
    const scripts = response.data.data!
    const pagination = (response.data as unknown as { pagination: { total: number } }).pagination
    
    return {
      items: scripts,
      total: pagination.total,
      page: page,
      per_page: perPage,
      total_pages: Math.ceil(pagination.total / perPage)
    }
  },

  // 특정 스크립트 조회
  async getScript(id: number): Promise<Script> {
    const response = await api.get<ApiResponse<Script>>(`/scripts/${id}`)
    return response.data.data!
  },

  // 스크립트 업로드
  async uploadScript(file: File): Promise<Script> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<ApiResponse<Script>>('/scripts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data!
  },

  // 스크립트 삭제
  async deleteScript(id: number): Promise<void> {
    await api.delete(`/scripts/${id}`)
  },

  // 스크립트 수정
  async updateScript(id: number, data: Partial<Script>): Promise<Script> {
    const response = await api.put<ApiResponse<Script>>(`/scripts/${id}`, data)
    return response.data.data!
  },

  // 스크립트 통계 조회
  async getStatistics(): Promise<{
    statistics: {
      total: number
      script_ready: number
      video_ready: number
      uploaded: number
      scheduled: number
      error: number
    }
    recent_script: {
      id: number
      title: string
      created_at: string
    } | null
  }> {
    const response = await api.get<ApiResponse<{
      statistics: {
        total: number
        script_ready: number
        video_ready: number
        uploaded: number
        scheduled: number
        error: number
      }
      recent_script: {
        id: number
        title: string
        created_at: string
      } | null
    }>>('/scripts/stats/summary')
    return response.data.data!
  }
}

// 업로드 API
export const uploadApi = {
  // 비디오 업로드
  async uploadVideo(scriptId: number, file: File): Promise<UploadProgress> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post<ApiResponse<UploadProgress>>(
      `/upload/video/${scriptId}`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data!
  },

  // YouTube 업로드
  async uploadToYouTube(scriptId: number, publishAt?: string): Promise<YouTubeUploadStatus> {
    const formData = new FormData()
    if (publishAt) {
      // ISO 8601 형식의 날짜/시간을 YouTube API용으로 변환
      const isoString = new Date(publishAt).toISOString()
      formData.append('publish_at', isoString)
    }
    
    const response = await api.post<ApiResponse<YouTubeUploadStatus>>(
      `/upload/youtube/${scriptId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    )
    return response.data.data!
  }
}

// 시스템 API - 완전 표준화
export const systemApi = {
  // 헬스 체크 - 인프라 API 인스턴스 사용
  async healthCheck(): Promise<{ status: string }> {
    const response = await infraApi.get('/health')
    return response.data
  },

  // 시스템 상태 조회 - 비즈니스 API 인스턴스 사용
  async getSystemStatus(): Promise<unknown> {
    const response = await api.get('/system/status')
    return response.data
  }
}

export default api