// 백엔드 모델과 일치하는 타입 정의
export interface Script {
  id: number
  title: string
  content: string
  description?: string
  tags?: string
  thumbnail_prompt?: string
  video_file_path?: string
  youtube_video_id?: string
  scheduled_time?: string
  status: 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error'
  created_at: string
  updated_at: string
}

// API 요청/응답 타입
export interface ScriptsListResponse {
  scripts: Script[]
  total: number
  page: number
  limit: number
}

export interface UploadStatusResponse {
  id: number
  title: string
  status: string
  created_at: string
  updated_at: string
  has_video_file: boolean
  youtube_video_id?: string
  scheduled_time?: string
  video_file_info?: {
    file_path: string
    file_size: number
    filename: string
  }
  youtube_url?: string
}

export interface YouTubeUploadRequest {
  scheduled_time?: string
  privacy_status: 'private' | 'unlisted' | 'public'
  category_id: number
}

export interface YouTubeUploadResponse {
  id: number
  title: string
  status: string
  youtube_video_id: string
  youtube_url: string
  privacy_status: string
  scheduled_time?: string
  message: string
  upload_timestamp: string
}

// 폼 데이터 타입
export interface ScriptFormData {
  file: File
}

export interface VideoUploadFormData {
  video_file: File
}

// UI 상태 타입
export interface UploadProgress {
  isUploading: boolean
  progress: number
  phase: 'script' | 'video' | 'youtube'
  message?: string
}

// API 응답 기본 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
}