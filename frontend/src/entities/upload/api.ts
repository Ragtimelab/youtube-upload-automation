import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/constants'
import type {
  YouTubeUploadRequest,
  UploadResponse,
  UploadStatusResponse,
  UploadProgress,
} from '@/shared/types'

export const uploadApi = {
  // 비디오 파일 업로드
  async uploadVideo(
    scriptId: string | number,
    file: File,
    onProgress?: (progress: number) => void
  ) {
    return apiClient.uploadFile<UploadResponse>(
      API_ENDPOINTS.VIDEO_UPLOAD(scriptId),
      file,
      'video_file',
      undefined,
      onProgress
    )
  },

  // YouTube 업로드
  async uploadToYouTube(scriptId: string | number, formData: FormData) {
    return apiClient.post<UploadResponse>(
      API_ENDPOINTS.YOUTUBE_UPLOAD(scriptId),
      formData
    )
  },

  // 업로드 상태 조회
  async getUploadStatus(scriptId: string | number) {
    return apiClient.get<UploadStatusResponse>(
      API_ENDPOINTS.UPLOAD_STATUS(scriptId)
    )
  },

  // 업로드 진행률 조회
  async getProgress(scriptId: string | number) {
    return apiClient.get<UploadProgress>(
      API_ENDPOINTS.UPLOAD_PROGRESS(scriptId)
    )
  },

  // 비디오 파일 삭제
  async deleteVideo(scriptId: string | number) {
    return apiClient.delete(API_ENDPOINTS.VIDEO_DELETE(scriptId))
  },

  // 업로드 시스템 상태 확인
  async getSystemHealth() {
    return apiClient.get('/api/upload/health')
  },
}