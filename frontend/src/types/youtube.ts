/**
 * YouTube 관련 타입 정의
 * YouTube API 및 업로드 관련 타입들을 중앙화
 */

import type { UploadState, BatchSettings, BatchProgress } from './common'
import type { Script } from './api'

// YouTube 업로드 단계
export type YouTubeUploadStep = 
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'thumbnail'
  | 'metadata'
  | 'publishing'
  | 'completed'
  | 'error'

// YouTube API 할당량 상태
export interface YouTubeQuotaStatus {
  canUpload: boolean
  remainingQuota: number
  dailyLimit: number
  usedToday: number
  resetTime: Date
  message?: string
}

// YouTube 업로드 진행 상태
export interface YouTubeUploadProgress extends UploadState {
  step: YouTubeUploadStep
  videoId?: string
  videoUrl?: string
  thumbnailUrl?: string
  estimatedTimeRemaining?: number
}

// YouTube 비디오 메타데이터
export interface YouTubeVideoMetadata {
  title: string
  description: string
  tags: string[]
  category: number
  privacy: 'private' | 'unlisted' | 'public'
  publishAt?: string
  language?: string
  defaultAudioLanguage?: string
}

// YouTube API 응답 타입들
export interface YouTubeVideoResponse {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  privacy: string
  publishedAt?: string
  thumbnails: {
    default?: string
    medium?: string
    high?: string
  }
  statistics: {
    viewCount: number
    likeCount: number
    commentCount: number
  }
}

// YouTube 채널 정보
export interface YouTubeChannelInfo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  videoCount: number
  viewCount: number
}

// YouTube 업로드 설정 확장
export interface YouTubeBatchSettings extends BatchSettings {
  maxConcurrentUploads: number
  retryAttempts: number
  skipDuplicates: boolean
  autoGenerateThumbnails: boolean
  notifyOnCompletion: boolean
}

// YouTube 스크립트 카드 Props
export interface YouTubeScriptCardProps {
  script: Script
  isBatchMode: boolean
  isSelected: boolean
  uploadState?: YouTubeUploadProgress
  singleUploadSchedule?: string
  onYouTubeUpload: (script: Script) => void
  onToggleSelection: (scriptId: number) => void
  onScheduleChange: (scriptId: number, value: string) => void
}

// YouTube 스크립트 리스트 Props
export interface YouTubeScriptListProps {
  scripts: Script[]
  isLoading: boolean
  isBatchMode: boolean
  selectedScripts: number[]
  uploadStates: Record<number, YouTubeUploadProgress>
  singleUploadSchedule: Record<number, string>
  onYouTubeUpload: (script: Script) => void
  onToggleSelection: (scriptId: number) => void
  onScheduleChange: (scriptId: number, value: string) => void
}

// YouTube 배치 컨트롤 Props
export interface YouTubeBatchControlsProps {
  selectedScripts: number[]
  batchUploading: boolean
  batchProgress: BatchProgress
  batchSettings: YouTubeBatchSettings
  onBatchUpload: () => void
  onBatchSettingsChange: (settings: YouTubeBatchSettings) => void
  onClearSelection: () => void
}

// YouTube 검색 필터 Props
export interface YouTubeSearchFilterProps {
  searchTerm: string
  statusFilter: string
  isBatchMode: boolean
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onBatchModeToggle: () => void
  children?: React.ReactNode
}

// YouTube 통계 카드 Props
export interface YouTubeStatsCardsProps {
  scripts: Script[]
  totalItems: number
  activeUploads: number
}

// YouTube 매니저 훅 반환 타입
export interface YouTubeManagerReturn {
  // 단일 업로드 상태
  singleUploadSchedule: Record<number, string>
  setSingleUploadSchedule: React.Dispatch<React.SetStateAction<Record<number, string>>>
  
  // 배치 업로드 상태
  selectedScripts: number[]
  isBatchMode: boolean
  batchUploading: boolean
  batchProgress: BatchProgress
  batchSettings: YouTubeBatchSettings
  
  // 액션 함수들
  handleYouTubeUpload: (script: Script) => Promise<void>
  handleBatchUpload: (scriptsData: { items: Script[] } | undefined) => Promise<void>
  toggleBatchMode: () => void
  toggleScriptSelection: (scriptId: number) => void
  setBatchSettings: (settings: YouTubeBatchSettings) => void
  setSelectedScripts: (scripts: number[]) => void
  handleSingleScheduleChange: (scriptId: number, value: string) => void
  
  // 유틸리티 함수들
  checkYouTubeQuota: () => Promise<YouTubeQuotaStatus>
  validateUploadSettings: (settings: YouTubeBatchSettings) => { valid: boolean; errors: string[] }
}

// YouTube API 에러 타입들
export interface YouTubeApiError {
  code: number
  message: string
  details?: {
    quotaExceeded?: boolean
    invalidCredentials?: boolean
    videoTooLarge?: boolean
    unsupportedFormat?: boolean
  }
}

// YouTube 업로드 이벤트 타입들
export type YouTubeUploadEvent = 
  | { type: 'started'; scriptId: number }
  | { type: 'progress'; scriptId: number; progress: number; step: YouTubeUploadStep }
  | { type: 'completed'; scriptId: number; videoId: string; videoUrl: string }
  | { type: 'error'; scriptId: number; error: string }
  | { type: 'cancelled'; scriptId: number }

// YouTube 업로드 상태 필터
export type YouTubeStatusFilter = 'all' | 'script_ready' | 'video_ready' | 'uploaded' | 'scheduled' | 'error'

// YouTube 정렬 옵션
export type YouTubeSortOption = 'created_at' | 'title' | 'status' | 'updated_at'
export type YouTubeSortDirection = 'asc' | 'desc'

export interface YouTubeSortConfig {
  field: YouTubeSortOption
  direction: YouTubeSortDirection
}