import axios from 'axios'
import type { 
  ApiResponse, 
  Script, 
  ScriptUploadRequest, 
  PaginatedResponse,
  UploadProgress,
  YouTubeUploadStatus 
} from '@/types/api'

// Axios 인스턴스 설정
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 응답 인터셉터로 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 스크립트 API
export const scriptApi = {
  // 스크립트 목록 조회
  async getScripts(page = 1, perPage = 10): Promise<PaginatedResponse<Script>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Script>>>('/scripts/', {
      params: { page, per_page: perPage }
    })
    return response.data.data!
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
  async uploadToYouTube(scriptId: number): Promise<YouTubeUploadStatus> {
    const response = await api.post<ApiResponse<YouTubeUploadStatus>>(
      `/upload/youtube/${scriptId}`
    )
    return response.data.data!
  }
}

// 시스템 API
export const systemApi = {
  // 헬스 체크
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/health')
    return response.data
  },

  // 시스템 상태 조회
  async getSystemStatus(): Promise<any> {
    const response = await api.get('/status')
    return response.data
  }
}

export default api