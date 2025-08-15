import { apiClient, API_ENDPOINTS } from '@/utils/api'
import { UploadStatusResponse, YouTubeUploadRequest, YouTubeUploadResponse } from '@/types'

export const uploadService = {
  // 비디오 파일 업로드
  async uploadVideo(scriptId: number, videoFile: File): Promise<{
    id: number
    title: string
    status: string
    video_file_path: string
    file_size: number
    message: string
  }> {
    const formData = new FormData()
    formData.append('video_file', videoFile)
    
    return apiClient.postFormData(API_ENDPOINTS.VIDEO_UPLOAD(scriptId), formData)
  },

  // YouTube 업로드
  async uploadToYouTube(
    scriptId: number, 
    options: YouTubeUploadRequest
  ): Promise<YouTubeUploadResponse> {
    return apiClient.post<YouTubeUploadResponse>(
      API_ENDPOINTS.YOUTUBE_UPLOAD(scriptId), 
      options
    )
  },

  // 업로드 상태 조회
  async getUploadStatus(scriptId: number): Promise<UploadStatusResponse> {
    return apiClient.get<UploadStatusResponse>(API_ENDPOINTS.UPLOAD_STATUS(scriptId))
  },

  // 비디오 파일 삭제
  async deleteVideo(scriptId: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.VIDEO_DELETE(scriptId))
  },
}