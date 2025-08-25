import { useState, useCallback, useEffect } from 'react'
import { useWebSocketContext } from './useWebSocketContext'
import { useToastHelpers } from './useToastContext'

/**
 * Phase 3: WebSocket 시스템 통합 - Context 기반으로 마이그레이션
 * Legacy useWebSocket → useWebSocketContext 통합
 */

export interface UploadProgressData {
  script_id: number
  progress: number
  status: 'starting' | 'processing' | 'completed' | 'error'
  message: string
  current_step?: string
  total_steps?: number
  error_message?: string
}

export interface YouTubeUploadData {
  script_id: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  youtube_video_id?: string
  youtube_url?: string
  error_message?: string
}

interface UploadStates {
  [scriptId: number]: {
    isUploading: boolean
    progress: number
    status: string
    message: string
    error?: string
    youtubeUrl?: string
    currentStep?: string
    totalSteps?: number
  }
}

export function useUploadProgress() {
  const [uploadStates, setUploadStates] = useState<UploadStates>({})
  const [globalStats, setGlobalStats] = useState({
    totalUploads: 0,
    activeUploads: 0,
    completedUploads: 0,
    failedUploads: 0,
    completedToday: 0,
    errorCount: 0,
    successRate: 0,
  })

  // 훅
  const toast = useToastHelpers()

  // WebSocket 연결 (Context 기반)
  const webSocketState = useWebSocketContext()

  // 업로드 상태 업데이트
  const updateUploadState = useCallback((scriptId: number, updates: Partial<UploadStates[number]>) => {
    setUploadStates(prev => ({
      ...prev,
      [scriptId]: {
        ...prev[scriptId],
        ...updates,
      }
    }))
  }, [])

  // 업로드 시작
  const startUpload = useCallback((scriptId: number, type: 'video' | 'youtube') => {
    updateUploadState(scriptId, {
      isUploading: true,
      progress: 0,
      status: 'starting',
      message: type === 'video' ? '비디오 업로드 시작...' : 'YouTube 업로드 시작...',
      error: undefined,
    })
  }, [updateUploadState])

  // 업로드 완료
  const completeUpload = useCallback((scriptId: number, data?: { youtubeUrl?: string }) => {
    updateUploadState(scriptId, {
      isUploading: false,
      progress: 100,
      status: 'completed',
      message: '업로드 완료',
      youtubeUrl: data?.youtubeUrl,
    })
  }, [updateUploadState])

  // 업로드 에러
  const errorUpload = useCallback((scriptId: number, error: string) => {
    updateUploadState(scriptId, {
      isUploading: false,
      status: 'error',
      error,
      message: '업로드 실패',
    })
  }, [updateUploadState])

  // 업로드 진행률 메시지 핸들러 (Context 기반)
  useEffect(() => {
    const unsubscribe = webSocketState.onMessage?.('upload_progress', (data) => {
      const typedData = data as UploadProgressData
      console.log('Upload progress received:', data)
      
      updateUploadState(typedData.script_id, {
        progress: typedData.progress,
        status: typedData.status,
        message: typedData.message,
        currentStep: typedData.current_step,
        totalSteps: typedData.total_steps,
        isUploading: typedData.status !== 'completed' && typedData.status !== 'error',
        error: typedData.status === 'error' ? typedData.error_message : undefined,
      })

      // 에러 발생 시 Toast 메시지 표시
      if (typedData.status === 'error' && typedData.error_message) {
        toast.error('업로드 실패', typedData.error_message)
      }
    })

    return unsubscribe
  }, [webSocketState, updateUploadState, toast])

  // YouTube 업로드 상태 메시지 핸들러 (Context 기반)
  useEffect(() => {
    const unsubscribe = webSocketState.onMessage?.('youtube_status', (data) => {
      const typedData = data as YouTubeUploadData
      console.log('YouTube status received:', data)
      
      updateUploadState(typedData.script_id, {
        progress: typedData.progress,
        status: typedData.status,
        message: typedData.status === 'completed' ? 'YouTube 업로드 완료' :
                typedData.status === 'error' ? 'YouTube 업로드 실패' :
                typedData.status === 'uploading' ? 'YouTube 업로드 중...' : '업로드 대기 중',
        isUploading: typedData.status === 'uploading' || typedData.status === 'pending',
        error: typedData.error_message,
        youtubeUrl: typedData.youtube_url,
      })

      // YouTube 업로드 완료/에러 시 Toast 메시지와 전역 통계 업데이트
      if (typedData.status === 'completed') {
        toast.success('YouTube 업로드 완료', '비디오가 성공적으로 YouTube에 업로드되었습니다.')
        setGlobalStats(prev => ({
          ...prev,
          activeUploads: Math.max(0, prev.activeUploads - 1),
          completedUploads: prev.completedUploads + 1,
        }))
      } else if (typedData.status === 'error') {
        if (typedData.error_message) {
          toast.error('YouTube 업로드 실패', typedData.error_message)
        }
        setGlobalStats(prev => ({
          ...prev,
          activeUploads: Math.max(0, prev.activeUploads - 1),
          failedUploads: prev.failedUploads + 1,
        }))
      }
    })

    return unsubscribe
  }, [webSocketState, updateUploadState, toast])

  // 시스템 알림 핸들러 (Context 기반)
  useEffect(() => {
    const unsubscribe = webSocketState.onMessage?.('system_notification', (data: unknown) => {
      console.log('System notification:', data)
      
      // 시스템 알림을 통해 전역 상태 업데이트
      if ((data as { type?: string }).type === 'upload_started') {
        setGlobalStats(prev => ({
          ...prev,
          totalUploads: prev.totalUploads + 1,
          activeUploads: prev.activeUploads + 1,
        }))
      }
    })

    return unsubscribe
  }, [webSocketState])

  // 특정 스크립트의 업로드 상태 조회
  const getUploadState = useCallback((scriptId: number) => {
    return uploadStates[scriptId] || {
      isUploading: false,
      progress: 0,
      status: 'ready',
      message: '업로드 준비',
    }
  }, [uploadStates])

  // 활성 업로드 목록 조회
  const getActiveUploads = useCallback(() => {
    return Object.entries(uploadStates)
      .filter(([_, state]) => state.isUploading)
      .map(([scriptId, state]) => ({
        scriptId: parseInt(scriptId),
        ...state,
      }))
  }, [uploadStates])

  // 업로드 상태 초기화
  const clearUploadState = useCallback((scriptId: number) => {
    setUploadStates(prev => {
      const newState = { ...prev }
      delete newState[scriptId]
      return newState
    })
  }, [])

  // WebSocket 상태 재요청 (Context 기반)
  const refreshStatus = useCallback(() => {
    webSocketState.sendMessage?.({ action: 'get_status' })
  }, [webSocketState])

  return {
    uploadStates,
    globalStats,
    webSocketState: {
      isConnected: webSocketState.isConnected || false,
      connectionStatus: webSocketState.connectionStatus || 'disconnected',
      error: webSocketState.error || null,
      reconnectAttempts: 0,
      lastActivity: new Date(),
    },
    startUpload,
    completeUpload,
    errorUpload,
    getUploadState,
    getActiveUploads,
    clearUploadState,
    refreshStatus,
  }
}