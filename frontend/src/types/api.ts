// API 공통 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  error_code?: string
  timestamp: string
}

// 스크립트 관련 타입
export interface Script {
  id: number
  filename: string
  title: string
  description: string
  tags: string[]
  thumbnail_text?: string
  thumbnail_prompt?: string
  script_content: string
  status: 'script_ready' | 'video_ready' | 'uploaded' | 'error'
  video_filename?: string
  video_path?: string
  youtube_video_id?: string
  youtube_url?: string
  created_at: string
  updated_at: string
}

// 스크립트 업로드 요청
export interface ScriptUploadRequest {
  file: File
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// 업로드 진행 상태
export interface UploadProgress {
  script_id: number
  progress: number
  status: 'starting' | 'processing' | 'completed' | 'error'
  message: string
  current_step?: string
  total_steps?: number
}

// YouTube 업로드 상태
export interface YouTubeUploadStatus {
  script_id: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  youtube_video_id?: string
  youtube_url?: string
  error_message?: string
}

// WebSocket 메시지 타입
export interface WebSocketMessage {
  type: 'upload_progress' | 'youtube_status' | 'system_status' | 'heartbeat'
  data: any
  timestamp: string
}