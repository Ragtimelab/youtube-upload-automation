/**
 * 타입 정의 통합 내보내기 파일
 * 모든 타입을 중앙에서 관리하고 쉽게 가져올 수 있도록 구성
 */

// 기존 API 타입들
export * from './api'

// 새로운 중앙화된 타입들
export * from './common'
export * from './youtube' 
export * from './dashboard'

// 유틸리티 타입들을 위한 네임스페이스
export namespace Types {
  // 공통 타입들
  export * from './common'
  
  // YouTube 관련 타입들
  export * as YouTube from './youtube'
  
  // 대시보드 관련 타입들
  export * as Dashboard from './dashboard'
  
  // API 관련 타입들
  export * as API from './api'
}

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
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]