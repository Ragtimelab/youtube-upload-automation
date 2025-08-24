/**
 * WebSocket 메시지 처리 및 알림 생성 로직
 * 알림 상태 관리와 WebSocket 통신을 분리
 */

import { useEffect, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { 
  Notification, 
  UploadProgressMessage, 
  YouTubeStatusMessage, 
  SystemNotificationMessage,
  SystemHealthMessage
} from './types'

interface UseNotificationWebSocketProps {
  onAddNotification: (_notification: Omit<Notification, 'id' | 'timestamp'>) => void
  onPlaySound: (_type: Notification['type']) => void
  pauseNotifications: boolean
}

export function useNotificationWebSocket({
  onAddNotification,
  onPlaySound,
  pauseNotifications
}: UseNotificationWebSocketProps) {
  const webSocket = useWebSocket({
    url: 'ws://localhost:8000/ws/',
    clientId: `notifications-${Date.now()}`,
    enableHeartbeat: true,
  })

  // WebSocket 메시지 핸들러들
  const handleUploadProgress = useCallback((data: unknown) => {
    const uploadData = data as UploadProgressMessage
    if (pauseNotifications) return
    
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      type: 'upload',
      title: '업로드 진행 중',
      message: uploadData.message,
      scriptId: uploadData.script_id,
      progress: uploadData.progress,
      isRead: false
    }
    
    onAddNotification(notification)
    onPlaySound('upload')
  }, [pauseNotifications, onAddNotification, onPlaySound])

  const handleYouTubeStatus = useCallback((data: unknown) => {
    const youtubeData = data as YouTubeStatusMessage
    if (pauseNotifications) return
    
    const getNotificationType = (status: string): Notification['type'] => {
      switch (status) {
        case 'completed': return 'success'
        case 'error': return 'error'
        case 'uploading': return 'upload'
        default: return 'info'
      }
    }
    
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      type: getNotificationType(youtubeData.status),
      title: youtubeData.status === 'completed' ? 'YouTube 업로드 완료' : 
             youtubeData.status === 'error' ? 'YouTube 업로드 실패' : 
             'YouTube 업로드 상태 변경',
      message: youtubeData.error_message || `스크립트 ${youtubeData.script_id} 상태: ${youtubeData.status}`,
      scriptId: youtubeData.script_id,
      youtubeUrl: youtubeData.youtube_url,
      progress: youtubeData.progress,
      isRead: false,
      persistent: youtubeData.status === 'error'
    }
    
    onAddNotification(notification)
    onPlaySound(getNotificationType(youtubeData.status))
  }, [pauseNotifications, onAddNotification, onPlaySound])

  const handleSystemNotification = useCallback((data: unknown) => {
    const systemData = data as SystemNotificationMessage
    if (pauseNotifications) return
    
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      type: systemData.level,
      title: systemData.title || '시스템 알림',
      message: systemData.message,
      isRead: false,
      persistent: systemData.level === 'error'
    }
    
    onAddNotification(notification)
    onPlaySound(systemData.level)
  }, [pauseNotifications, onAddNotification, onPlaySound])

  const handleSystemHealth = useCallback((data: unknown) => {
    const healthData = data as SystemHealthMessage
    if (pauseNotifications) return
    
    const isHealthy = healthData.status === 'healthy'
    const notification: Omit<Notification, 'id' | 'timestamp'> = {
      type: isHealthy ? 'success' : 'warning',
      title: '시스템 상태',
      message: isHealthy ? '시스템이 정상 작동 중입니다.' : '시스템에 문제가 발생했습니다.',
      isRead: false
    }
    
    onAddNotification(notification)
    onPlaySound(isHealthy ? 'success' : 'warning')
  }, [pauseNotifications, onAddNotification, onPlaySound])

  // WebSocket 메시지 구독
  useEffect(() => {
    if (!webSocket.isConnected) return

    const unsubscribes = [
      webSocket.onMessage('upload_progress', handleUploadProgress),
      webSocket.onMessage('youtube_status', handleYouTubeStatus),
      webSocket.onMessage('system_notification', handleSystemNotification),
      webSocket.onMessage('system_health', handleSystemHealth)
    ]

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [
    webSocket.isConnected,
    webSocket.onMessage,
    webSocket,
    handleUploadProgress,
    handleYouTubeStatus,
    handleSystemNotification,
    handleSystemHealth
  ])

  return {
    isConnected: webSocket.isConnected,
    connectionStatus: webSocket.connectionStatus
  }
}