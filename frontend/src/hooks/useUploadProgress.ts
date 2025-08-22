import { useState, useCallback, useEffect } from 'react'
import { useWebSocket } from './useWebSocket'

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
  })

  // WebSocket 연결 설정
  const webSocket = useWebSocket({
    url: 'ws://localhost:8000/ws/',
    clientId: `youtube-upload-${Date.now()}`,
    enableHeartbeat: true,
  })

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

  // 업로드 진행률 메시지 핸들러
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('upload_progress', (data: UploadProgressData) => {
      console.log('Upload progress received:', data)
      
      updateUploadState(data.script_id, {
        progress: data.progress,
        status: data.status,
        message: data.message,
        currentStep: data.current_step,
        totalSteps: data.total_steps,
        isUploading: data.status !== 'completed' && data.status !== 'error',
        error: data.status === 'error' ? data.error_message : undefined,
      })
    })

    return unsubscribe
  }, [webSocket.onMessage, updateUploadState])

  // YouTube 업로드 상태 메시지 핸들러
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('youtube_status', (data: YouTubeUploadData) => {
      console.log('YouTube status received:', data)
      
      updateUploadState(data.script_id, {
        progress: data.progress,
        status: data.status,
        message: data.status === 'completed' ? 'YouTube 업로드 완료' :
                data.status === 'error' ? 'YouTube 업로드 실패' :
                data.status === 'uploading' ? 'YouTube 업로드 중...' : '업로드 대기 중',
        isUploading: data.status === 'uploading' || data.status === 'pending',
        error: data.error_message,
        youtubeUrl: data.youtube_url,
      })

      // YouTube 업로드 완료 시 전역 통계 업데이트
      if (data.status === 'completed') {
        setGlobalStats(prev => ({
          ...prev,
          activeUploads: Math.max(0, prev.activeUploads - 1),
          completedUploads: prev.completedUploads + 1,
        }))
      } else if (data.status === 'error') {
        setGlobalStats(prev => ({
          ...prev,
          activeUploads: Math.max(0, prev.activeUploads - 1),
          failedUploads: prev.failedUploads + 1,
        }))
      }
    })

    return unsubscribe
  }, [webSocket.onMessage, updateUploadState])

  // 시스템 알림 핸들러
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('system_notification', (data: any) => {
      console.log('System notification:', data)
      
      // 시스템 알림을 통해 전역 상태 업데이트
      if (data.type === 'upload_started') {
        setGlobalStats(prev => ({
          ...prev,
          totalUploads: prev.totalUploads + 1,
          activeUploads: prev.activeUploads + 1,
        }))
      }
    })

    return unsubscribe
  }, [webSocket.onMessage])

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

  // WebSocket 상태 재요청
  const refreshStatus = useCallback(() => {
    webSocket.requestStatus()
  }, [webSocket])

  return {
    uploadStates,
    globalStats,
    webSocketState: {
      isConnected: webSocket.isConnected,
      connectionStatus: webSocket.connectionStatus,
      error: webSocket.error,
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