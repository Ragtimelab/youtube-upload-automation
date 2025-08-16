import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/constants'
import type {
  Script,
  CreateScriptRequest,
  UpdateScriptRequest,
  GetScriptsParams,
  ScriptStats,
  PaginatedResponse,
} from '@/shared/types'

export const scriptApi = {
  // 스크립트 목록 조회
  async getScripts(params: GetScriptsParams = {}) {
    const searchParams = new URLSearchParams()
    
    if (params.status) searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.skip) searchParams.append('skip', params.skip.toString())
    if (params.search) searchParams.append('search', params.search)

    const query = searchParams.toString()
    const endpoint = query ? `${API_ENDPOINTS.SCRIPTS}?${query}` : API_ENDPOINTS.SCRIPTS

    return apiClient.get<PaginatedResponse<Script>>(endpoint)
  },

  // 스크립트 상세 조회
  async getScript(id: string | number) {
    return apiClient.get<Script>(API_ENDPOINTS.SCRIPT_DETAIL(id))
  },

  // 스크립트 파일 업로드
  async uploadScriptFile(file: File, onProgress?: (progress: number) => void) {
    return apiClient.uploadFile<Script>(
      API_ENDPOINTS.SCRIPT_UPLOAD,
      file,
      'file',
      undefined,
      onProgress
    )
  },

  // 스크립트 생성
  async createScript(data: CreateScriptRequest) {
    return apiClient.post<Script>(API_ENDPOINTS.SCRIPTS, data)
  },

  // 스크립트 업데이트
  async updateScript(id: string | number, data: UpdateScriptRequest) {
    return apiClient.put<Script>(API_ENDPOINTS.SCRIPT_DETAIL(id), data)
  },

  // 스크립트 삭제
  async deleteScript(id: string | number) {
    return apiClient.delete(API_ENDPOINTS.SCRIPT_DETAIL(id))
  },

  // 스크립트 통계 조회
  async getScriptStats() {
    return apiClient.get<ScriptStats>(API_ENDPOINTS.SCRIPT_STATS)
  },
}