import type { DateString, ID, UploadStatus } from '@/shared/types/common'

// 스크립트 엔티티
export interface Script {
  id: ID
  title: string
  content: string
  description?: string
  tags?: string
  thumbnail_text?: string
  imagefx_prompt?: string
  status: UploadStatus
  video_file_path?: string
  youtube_video_id?: string
  scheduled_time?: DateString
  created_at: DateString
  updated_at: DateString
}

// 스크립트 생성 요청
export interface CreateScriptRequest {
  title: string
  content: string
  description?: string
  tags?: string
  thumbnail_text?: string
  imagefx_prompt?: string
}

// 스크립트 업데이트 요청
export interface UpdateScriptRequest {
  title?: string
  content?: string
  description?: string
  tags?: string
  thumbnail_text?: string
  imagefx_prompt?: string
  status?: UploadStatus
  scheduled_time?: DateString
}

// 스크립트 목록 조회 파라미터
export interface GetScriptsParams {
  status?: UploadStatus
  limit?: number
  skip?: number
  search?: string
}

// 스크립트 통계
export interface ScriptStats {
  total: number
  script_ready: number
  video_ready: number
  uploaded: number
  scheduled: number
  error: number
}

// 스크립트 파싱 결과
export interface ParsedScript {
  title: string
  content: string
  description: string
  tags: string[]
  thumbnail_text: string
  imagefx_prompt: string
}