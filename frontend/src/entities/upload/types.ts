import type { DateString, ID, Progress } from '@/shared/types/common'

// 업로드 단계
export type UploadPhase = 'video' | 'youtube' | 'completed'

// 업로드 진행 상태
export interface UploadProgress extends Progress {
  script_id: ID
  title: string
  status: string
  progress_percentage: number
  current_step: string
  total_steps: number
  created_at: DateString
  updated_at: DateString
  video_file_info?: {
    filename: string
    file_size: number
    file_size_mb: number
  }
  youtube_info?: {
    video_id: string
    url: string
    scheduled_time?: DateString
  }
}

// 비디오 업로드 요청
export interface VideoUploadRequest {
  script_id: ID
  file: File
}

// YouTube 업로드 요청
export interface YouTubeUploadRequest {
  script_id: ID
  privacy_status?: 'private' | 'public' | 'unlisted'
  scheduled_time?: DateString
  category_id?: string
}

// 업로드 응답
export interface UploadResponse {
  script_id: ID
  status: 'success' | 'error' | 'in_progress'
  message?: string
  youtube_video_id?: string
  progress?: UploadProgress
}

// 업로드 상태 조회 응답
export interface UploadStatusResponse {
  script_id: ID
  status: string
  progress?: UploadProgress
  error?: string
  video_file_path?: string
  youtube_video_id?: string
}

// YouTube 비디오 정보
export interface YouTubeVideoInfo {
  id: string
  title: string
  description: string
  thumbnail_url: string
  duration: string
  view_count: number
  like_count: number
  privacy_status: string
  published_at: DateString
}