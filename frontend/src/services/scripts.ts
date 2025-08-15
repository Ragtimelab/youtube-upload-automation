import { apiClient, API_ENDPOINTS } from '@/utils/api'
import { Script, ScriptsListResponse } from '@/types'

export const scriptService = {
  // 대본 목록 조회
  async getScripts(params: {
    page?: number
    limit?: number
    status?: string
  } = {}): Promise<ScriptsListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status) searchParams.set('status', params.status)

    const endpoint = `${API_ENDPOINTS.SCRIPTS}?${searchParams.toString()}`
    return apiClient.get<ScriptsListResponse>(endpoint)
  },

  // 대본 상세 조회
  async getScript(id: number): Promise<Script> {
    return apiClient.get<Script>(API_ENDPOINTS.SCRIPT_DETAIL(id))
  },

  // 대본 업로드
  async uploadScript(file: File): Promise<Script> {
    const formData = new FormData()
    formData.append('file', file)
    
    return apiClient.postFormData<Script>(API_ENDPOINTS.SCRIPT_UPLOAD, formData)
  },

  // 대본 수정
  async updateScript(id: number, data: Partial<Script>): Promise<Script> {
    return apiClient.put<Script>(API_ENDPOINTS.SCRIPT_DETAIL(id), data)
  },

  // 대본 삭제
  async deleteScript(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.SCRIPT_DETAIL(id))
  },
}