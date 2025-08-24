/**
 * 타입 정의 통합 내보내기 파일
 * 모든 타입을 중앙에서 관리하고 쉽게 가져올 수 있도록 구성
 */

// 기존 API 타입들
export type {
  ApiResponse,
  Script,
  ScriptUploadRequest,
  PaginatedResponse,
  UploadProgress,
  YouTubeUploadStatus,
  WebSocketMessageType,
  WebSocketMessage,
  WebSocketConnectionStatus,
  WebSocketState
} from './api'

// 새로운 중앙화된 타입들
export type {
  LoadingState,
  ConnectionStatus,
  UploadStatus,
  UploadState,
  UploadStates,
  BatchSettings,
  BatchProgress
} from './common'

export type {
  YouTubeUploadStep,
  YouTubeQuotaStatus,
  YouTubeUploadProgress,
  YouTubeVideoMetadata,
  YouTubeVideoResponse,
  YouTubeChannelInfo,
  YouTubeBatchSettings,
  YouTubeScriptCardProps,
  YouTubeScriptListProps,
  YouTubeBatchControlsProps,
  YouTubeSearchFilterProps,
  YouTubeStatsCardsProps,
  YouTubeManagerReturn,
  YouTubeApiError,
  YouTubeUploadEvent,
  YouTubeStatusFilter,
  YouTubeSortOption,
  YouTubeSortDirection,
  YouTubeSortConfig
} from './youtube'

export type {
  SystemMetrics,
  DashboardData,
  ChartDataPoint,
  ChartData
} from './dashboard'

// 타입 가드 함수들
export function isUploadState(obj: unknown): obj is import('./common').UploadState {
  return typeof obj === 'object' && 
         obj !== null && 
         'isUploading' in obj && 
         'progress' in obj && 
         'message' in obj
}

export function isBatchSettings(obj: unknown): obj is import('./common').BatchSettings {
  return typeof obj === 'object' && 
         obj !== null && 
         'delay' in obj && 
         'privacy' in obj && 
         'category' in obj
}

export function isSystemMetrics(obj: unknown): obj is import('./dashboard').SystemMetrics {
  return typeof obj === 'object' && 
         obj !== null && 
         'totalScripts' in obj && 
         'scriptsByStatus' in obj
}

// 타입 유틸리티 함수들
export type ExtractArrayType<T> = T extends (infer U)[] ? U : never
export type ExtractPromiseType<T> = T extends Promise<infer U> ? U : never
export type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never
}[keyof T]
export type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K
}[keyof T]