import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastHelpers } from '@/hooks/useToastContext'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { uploadApi } from '@/services/api'
import { scriptQueryKeys } from '@/hooks/useUnifiedScripts'

/**
 * React 19 설계 철학 기반 통합 업로드 관리 훅
 * Phase 1: 상태 관리 통합 - useUploadStore (433줄) 완전 대체
 * 
 * Single Source of Truth: 업로드 상태는 WebSocket + React Query 조합
 * - 실시간 진행률: WebSocket (useUploadProgress)
 * - API 상태: React Query Mutations
 * - 로컬 UI 상태: 최소화된 Context 사용
 */

// 배치 업로드 설정 타입
interface BatchUploadSettings {
  delay: number // 업로드 간 지연시간 (초)
  privacy: 'private' | 'public' | 'unlisted'
  category: number
  publishAt: string // ISO 날짜 문자열
  retryOnError: boolean
  maxRetries: number
}

// 기본 배치 설정
const DEFAULT_BATCH_SETTINGS: BatchUploadSettings = {
  delay: 30, // 30초 간격
  privacy: 'private',
  category: 22, // People & Blogs
  publishAt: '',
  retryOnError: true,
  maxRetries: 3
}

/**
 * 메인 통합 업로드 훅 - 모든 업로드 관련 로직 통합
 */
export function useUnifiedUpload() {
  const { success, error } = useToastHelpers()
  const errorHandler = useErrorHandler('UnifiedUpload')
  const queryClient = useQueryClient()
  
  // WebSocket 기반 실시간 업로드 진행률
  const { 
    webSocketState, 
    globalStats, 
    getActiveUploads 
  } = useUploadProgress()

  // 비디오 업로드 Mutation
  const uploadVideoMutation = useMutation({
    mutationFn: ({ scriptId, file }: { scriptId: number; file: File }) => 
      uploadApi.uploadVideo(scriptId, file),
    onSuccess: (data) => {
      // 업로드 성공 시 스크립트 상태 업데이트
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script', data.script_id] })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success('비디오 업로드 완료', '비디오가 성공적으로 업로드되었습니다.')
    },
    onError: (err) => {
      errorHandler.setError(err, 'Video upload failed')
    }
  })

  // YouTube 업로드 Mutation
  const uploadToYouTubeMutation = useMutation({
    mutationFn: (scriptId: number) => uploadApi.uploadToYouTube(scriptId),
    onSuccess: (data) => {
      // YouTube 업로드 시작 시 상태 업데이트
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script', data.script_id] })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success('YouTube 업로드 시작', 'YouTube 업로드가 시작되었습니다. 진행 상황은 실시간으로 표시됩니다.')
    },
    onError: (err) => {
      errorHandler.setError(err, 'YouTube upload failed')
    }
  })

  // 예약 YouTube 업로드 Mutation
  const scheduledUploadMutation = useMutation({
    mutationFn: ({ scriptId, publishAt }: { scriptId: number; publishAt: string }) => 
      uploadApi.uploadToYouTube(scriptId, publishAt),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script', data.script_id] })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      success(
        '예약 업로드 설정 완료', 
        `${new Date(variables.publishAt).toLocaleString('ko-KR')}에 업로드 예정입니다.`
      )
    },
    onError: (err) => {
      errorHandler.setError(err, 'Scheduled upload failed')
    }
  })

  // 배치 업로드 Mutation
  const batchUploadMutation = useMutation({
    mutationFn: async ({ 
      scriptIds, 
      settings 
    }: { 
      scriptIds: number[]
      settings: BatchUploadSettings 
    }) => {
      const results = []
      
      for (let i = 0; i < scriptIds.length; i++) {
        const scriptId = scriptIds[i]
        
        try {
          const publishAt = settings.publishAt 
            ? new Date(new Date(settings.publishAt).getTime() + (i * settings.delay * 1000)).toISOString()
            : undefined
            
          const result = await uploadApi.uploadToYouTube(scriptId, publishAt)
          results.push({ scriptId, result, success: true })
          
          // 배치 업로드 간 지연
          if (i < scriptIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, settings.delay * 1000))
          }
        } catch (err) {
          results.push({ scriptId, error: err, success: false })
          
          if (!settings.retryOnError) {
            break // 에러 시 중단
          }
        }
      }
      
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const totalCount = results.length
      
      // 모든 스크립트 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.stats() })
      
      if (successCount === totalCount) {
        success(
          '배치 업로드 완료', 
          `${totalCount}개 스크립트가 모두 성공적으로 업로드되었습니다.`
        )
      } else {
        error(
          '배치 업로드 부분 실패', 
          `${successCount}/${totalCount}개 스크립트가 업로드되었습니다.`
        )
      }
    },
    onError: (err) => {
      errorHandler.setError(err, 'Batch upload failed')
    }
  })

  // 업로드 취소 함수 (현재 미구현)
  // const cancelUpload = useCallback(async (scriptId: number) => {
  //   try {
  //     await uploadApi.cancelUpload?.(scriptId)
  //     
  //     // 관련 쿼리 무효화
  //     queryClient.invalidateQueries({ queryKey: ['scripts'] })
  //     queryClient.invalidateQueries({ queryKey: ['script', scriptId] })
  //     
  //     success('업로드 취소됨', '업로드가 취소되었습니다.')
  //   } catch (err) {
  //     errorHandler.setError(err, 'Cancel upload failed')
  //   }
  // }, [success, errorHandler, queryClient])

  // 현재 업로드 상태 통계
  const uploadStats = useMemo(() => {
    const activeUploads = getActiveUploads()
    
    return {
      activeCount: activeUploads.length,
      totalUploaded: globalStats?.completedUploads || 0,
      totalFailed: globalStats?.failedUploads || 0,
      isAnyUploading: activeUploads.length > 0,
      
      // 진행 중인 업로드들의 평균 진행률
      averageProgress: activeUploads.length > 0 
        ? Math.round(activeUploads.reduce((sum, upload) => sum + upload.progress, 0) / activeUploads.length)
        : 0
    }
  }, [globalStats, getActiveUploads])

  // 액션 함수들
  const actions = useMemo(() => ({
    // 개별 업로드
    uploadVideo: (scriptId: number, file: File) => 
      uploadVideoMutation.mutate({ scriptId, file }),
      
    uploadToYouTube: (scriptId: number) => 
      uploadToYouTubeMutation.mutate(scriptId),
      
    scheduleUpload: (scriptId: number, publishAt: string) => 
      scheduledUploadMutation.mutate({ scriptId, publishAt }),
    
    // 배치 업로드
    batchUpload: (scriptIds: number[], settings: Partial<BatchUploadSettings> = {}) => 
      batchUploadMutation.mutate({ 
        scriptIds, 
        settings: { ...DEFAULT_BATCH_SETTINGS, ...settings } 
      }),
    
    // 업로드 취소 (현재 미구현)
    // cancelUpload,
    
    // 쿼리 무효화 헬퍼들
    refreshUploadStates: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: scriptQueryKeys.all })
    }
  }), [
    uploadVideoMutation, 
    uploadToYouTubeMutation, 
    scheduledUploadMutation,
    batchUploadMutation,
    // cancelUpload,
    queryClient
  ])

  return {
    // WebSocket 기반 실시간 데이터
    webSocketState,
    globalStats,
    activeUploads: getActiveUploads(),
    uploadStats,
    
    // 로딩 상태들
    isUploadingVideo: uploadVideoMutation.isPending,
    isUploadingToYouTube: uploadToYouTubeMutation.isPending,
    isSchedulingUpload: scheduledUploadMutation.isPending,
    isBatchUploading: batchUploadMutation.isPending,
    
    // 에러 상태들
    videoUploadError: uploadVideoMutation.error,
    youtubeUploadError: uploadToYouTubeMutation.error,
    scheduleUploadError: scheduledUploadMutation.error,
    batchUploadError: batchUploadMutation.error,
    
    // 액션들
    ...actions,
    
    // 기본 설정
    defaultBatchSettings: DEFAULT_BATCH_SETTINGS
  }
}

/**
 * 특정 스크립트의 업로드 상태 전용 훅
 */
export function useScriptUploadState(scriptId: number) {
  const { webSocketState, getActiveUploads } = useUploadProgress()
  const activeUploads = getActiveUploads()
  
  const uploadState = useMemo(() => {
    const activeUpload = activeUploads.find((upload: { scriptId?: number; script_id?: number }) => 
      upload.scriptId === scriptId || upload.script_id === scriptId
    )
    
    return activeUpload || null
  }, [activeUploads, scriptId])
  
  return {
    uploadState,
    isUploading: !!uploadState,
    progress: uploadState?.progress || 0,
    message: uploadState?.message || '',
    isWebSocketConnected: webSocketState.isConnected
  }
}

