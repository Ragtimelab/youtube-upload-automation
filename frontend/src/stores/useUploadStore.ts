import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { UploadState } from '@/types'

/**
 * React 19 최적화된 업로드 상태 관리
 * 정규화된 구조로 실시간 업로드 진행률 추적
 */

export interface BatchUploadSettings {
  delay: number // 업로드 간 지연시간 (초)
  privacy: 'private' | 'public' | 'unlisted'
  category: number
  publishAt: string // ISO 날짜 문자열
  retryOnError: boolean
  maxRetries: number
}

interface UploadStoreState {
  // 정규화된 업로드 상태 - scriptId로 인덱싱
  uploadStates: Record<string, UploadState>
  
  // 배치 업로드 관리
  batchUpload: {
    isActive: boolean
    selectedScriptIds: string[]
    settings: BatchUploadSettings
    queue: string[] // 대기열의 scriptId들
    currentScriptId: string | null
    progress: {
      completed: number
      total: number
      current: string | null // 현재 처리 중인 스크립트 ID
    }
    errors: Array<{
      scriptId: string
      error: string
      timestamp: Date
    }>
  }
  
  // 단일 업로드 예약 관리
  scheduleSettings: Record<string, string> // scriptId -> ISO 날짜 문자열
  
  // 전역 상태
  isLoading: boolean
  error: string | null
  
  // 액션들 - 단일 업로드
  startUpload: (scriptId: string) => void
  updateUploadProgress: (scriptId: string, progress: Partial<UploadState>) => void
  completeUpload: (scriptId: string, success: boolean, data?: any) => void
  cancelUpload: (scriptId: string) => void
  
  // 액션들 - 배치 업로드
  setBatchSettings: (settings: Partial<BatchUploadSettings>) => void
  startBatchUpload: (scriptIds: string[]) => void
  pauseBatchUpload: () => void
  resumeBatchUpload: () => void
  cancelBatchUpload: () => void
  
  // 예약 발행 관리
  setSchedule: (scriptId: string, schedule: string) => void
  removeSchedule: (scriptId: string) => void
  getScheduledUploads: () => Array<{ scriptId: string; schedule: string }>
  
  // 조회 헬퍼
  getUploadState: (scriptId: string) => UploadState | undefined
  getActiveUploads: () => UploadState[]
  getBatchProgress: () => { completed: number; total: number; percentage: number }
  
  // 통계 & 분석
  getUploadStats: () => {
    total: number
    active: number
    completed: number
    failed: number
    pending: number
  }
  
  // 상태 관리
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const DEFAULT_BATCH_SETTINGS: BatchUploadSettings = {
  delay: 30, // 30초 간격
  privacy: 'private',
  category: 22, // People & Blogs
  publishAt: '',
  retryOnError: true,
  maxRetries: 3
}

export const useUploadStore = create<UploadStoreState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // 초기 상태
        uploadStates: {},
        batchUpload: {
          isActive: false,
          selectedScriptIds: [],
          settings: DEFAULT_BATCH_SETTINGS,
          queue: [],
          currentScriptId: null,
          progress: {
            completed: 0,
            total: 0,
            current: null
          },
          errors: []
        },
        scheduleSettings: {},
        isLoading: false,
        error: null,

        // 단일 업로드 시작
        startUpload: (scriptId: string) => set((state) => {
          state.uploadStates[scriptId] = {
            isUploading: true,
            progress: 0,
            message: '업로드 준비 중...',
            currentStep: 1,
            totalSteps: 5,
            startTime: new Date(),
            error: null
          }
        }),

        // 업로드 진행률 업데이트
        updateUploadProgress: (scriptId: string, progress: Partial<UploadState>) => set((state) => {
          const currentState = state.uploadStates[scriptId]
          if (currentState) {
            state.uploadStates[scriptId] = { ...currentState, ...progress }
          }
        }),

        // 업로드 완료 처리
        completeUpload: (scriptId: string, success: boolean, data?: any) => set((state) => {
          const currentState = state.uploadStates[scriptId]
          if (currentState) {
            state.uploadStates[scriptId] = {
              ...currentState,
              isUploading: false,
              progress: success ? 100 : currentState.progress,
              message: success ? '업로드 완료' : '업로드 실패',
              error: success ? null : (data?.error || '알 수 없는 오류'),
              endTime: new Date(),
              result: data
            }
          }

          // 배치 업로드 진행 중인 경우 다음 항목 처리
          if (state.batchUpload.isActive && state.batchUpload.currentScriptId === scriptId) {
            state.batchUpload.progress.completed += 1
            
            if (!success) {
              state.batchUpload.errors.push({
                scriptId,
                error: data?.error || '업로드 실패',
                timestamp: new Date()
              })
            }

            // 다음 대기열 항목으로 이동
            const nextIndex = state.batchUpload.queue.indexOf(scriptId) + 1
            if (nextIndex < state.batchUpload.queue.length) {
              state.batchUpload.currentScriptId = state.batchUpload.queue[nextIndex]
              state.batchUpload.progress.current = state.batchUpload.currentScriptId
            } else {
              // 배치 업로드 완료
              state.batchUpload.isActive = false
              state.batchUpload.currentScriptId = null
              state.batchUpload.progress.current = null
            }
          }
        }),

        // 업로드 취소
        cancelUpload: (scriptId: string) => set((state) => {
          const currentState = state.uploadStates[scriptId]
          if (currentState) {
            state.uploadStates[scriptId] = {
              ...currentState,
              isUploading: false,
              message: '업로드 취소됨',
              error: '사용자가 취소함',
              endTime: new Date()
            }
          }
        }),

        // 배치 설정 업데이트
        setBatchSettings: (settings: Partial<BatchUploadSettings>) => set((state) => {
          state.batchUpload.settings = { ...state.batchUpload.settings, ...settings }
        }),

        // 배치 업로드 시작
        startBatchUpload: (scriptIds: string[]) => set((state) => {
          state.batchUpload = {
            ...state.batchUpload,
            isActive: true,
            selectedScriptIds: [...scriptIds],
            queue: [...scriptIds],
            currentScriptId: scriptIds[0] || null,
            progress: {
              completed: 0,
              total: scriptIds.length,
              current: scriptIds[0] || null
            },
            errors: []
          }

          // 각 스크립트의 업로드 상태 초기화
          scriptIds.forEach(scriptId => {
            state.uploadStates[scriptId] = {
              isUploading: false,
              progress: 0,
              message: '대기 중...',
              currentStep: 0,
              totalSteps: 5,
              startTime: null,
              error: null
            }
          })
        }),

        // 배치 업로드 일시정지
        pauseBatchUpload: () => set((state) => {
          state.batchUpload.isActive = false
        }),

        // 배치 업로드 재개
        resumeBatchUpload: () => set((state) => {
          if (state.batchUpload.queue.length > state.batchUpload.progress.completed) {
            state.batchUpload.isActive = true
          }
        }),

        // 배치 업로드 취소
        cancelBatchUpload: () => set((state) => {
          // 현재 업로드 중인 항목 취소
          if (state.batchUpload.currentScriptId) {
            const currentState = state.uploadStates[state.batchUpload.currentScriptId]
            if (currentState?.isUploading) {
              state.uploadStates[state.batchUpload.currentScriptId] = {
                ...currentState,
                isUploading: false,
                message: '배치 업로드 취소됨',
                error: '사용자가 배치 업로드를 취소함'
              }
            }
          }

          // 대기 중인 항목들 상태 업데이트
          state.batchUpload.queue.forEach(scriptId => {
            if (!state.uploadStates[scriptId]?.isUploading) {
              state.uploadStates[scriptId] = {
                isUploading: false,
                progress: 0,
                message: '취소됨',
                error: '배치 업로드가 취소됨',
                currentStep: 0,
                totalSteps: 5,
                startTime: null
              }
            }
          })

          // 배치 상태 초기화
          state.batchUpload = {
            isActive: false,
            selectedScriptIds: [],
            settings: DEFAULT_BATCH_SETTINGS,
            queue: [],
            currentScriptId: null,
            progress: {
              completed: 0,
              total: 0,
              current: null
            },
            errors: []
          }
        }),

        // 예약 발행 설정
        setSchedule: (scriptId: string, schedule: string) => set((state) => {
          if (schedule) {
            state.scheduleSettings[scriptId] = schedule
          } else {
            delete state.scheduleSettings[scriptId]
          }
        }),

        // 예약 제거
        removeSchedule: (scriptId: string) => set((state) => {
          delete state.scheduleSettings[scriptId]
        }),

        // 예약된 업로드 목록 조회
        getScheduledUploads: () => {
          const state = get()
          return Object.entries(state.scheduleSettings).map(([scriptId, schedule]) => ({
            scriptId,
            schedule
          }))
        },

        // 업로드 상태 조회
        getUploadState: (scriptId: string) => {
          const state = get()
          return state.uploadStates[scriptId]
        },

        // 진행 중인 업로드 목록
        getActiveUploads: () => {
          const state = get()
          return Object.values(state.uploadStates).filter(upload => upload.isUploading)
        },

        // 배치 진행률
        getBatchProgress: () => {
          const state = get()
          const { completed, total } = state.batchUpload.progress
          return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
          }
        },

        // 업로드 통계
        getUploadStats: () => {
          const state = get()
          const uploads = Object.values(state.uploadStates)
          
          return {
            total: uploads.length,
            active: uploads.filter(u => u.isUploading).length,
            completed: uploads.filter(u => !u.isUploading && !u.error && u.progress === 100).length,
            failed: uploads.filter(u => !u.isUploading && u.error).length,
            pending: uploads.filter(u => !u.isUploading && !u.error && u.progress < 100).length
          }
        },

        // 상태 관리
        setLoading: (loading: boolean) => set((state) => {
          state.isLoading = loading
          if (loading) {
            state.error = null
          }
        }),

        setError: (error: string | null) => set((state) => {
          state.error = error
          state.isLoading = false
        }),

        // 상태 초기화
        reset: () => set((state) => {
          state.uploadStates = {}
          state.batchUpload = {
            isActive: false,
            selectedScriptIds: [],
            settings: DEFAULT_BATCH_SETTINGS,
            queue: [],
            currentScriptId: null,
            progress: {
              completed: 0,
              total: 0,
              current: null
            },
            errors: []
          }
          state.scheduleSettings = {}
          state.isLoading = false
          state.error = null
        })
      }))
    ),
    {
      name: 'upload-store'
    }
  )
)

/**
 * 특정 스크립트의 업로드 상태만 구독하는 훅
 */
export const useScriptUpload = (scriptId: string) => {
  return useUploadStore(state => ({
    uploadState: state.uploadStates[scriptId],
    schedule: state.scheduleSettings[scriptId],
    startUpload: () => state.startUpload(scriptId),
    cancelUpload: () => state.cancelUpload(scriptId),
    setSchedule: (schedule: string) => state.setSchedule(scriptId, schedule)
  }))
}

/**
 * 배치 업로드 상태만 구독하는 훅
 */
export const useBatchUpload = () => {
  return useUploadStore(state => ({
    batchState: state.batchUpload,
    settings: state.batchUpload.settings,
    progress: state.getBatchProgress(),
    setBatchSettings: state.setBatchSettings,
    startBatchUpload: state.startBatchUpload,
    pauseBatchUpload: state.pauseBatchUpload,
    resumeBatchUpload: state.resumeBatchUpload,
    cancelBatchUpload: state.cancelBatchUpload
  }))
}

/**
 * 업로드 통계만 구독하는 훅
 */
export const useUploadStats = () => {
  return useUploadStore(state => ({
    stats: state.getUploadStats(),
    activeUploads: state.getActiveUploads().length,
    scheduledUploads: state.getScheduledUploads().length
  }))
}