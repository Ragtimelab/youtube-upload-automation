import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Youtube, 
  X, 
  Settings,
  Volume2,
  VolumeX,
  Filter,
  Clock
} from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info' | 'upload'
  title: string
  message: string
  timestamp: Date
  scriptId?: number
  youtubeUrl?: string
  progress?: number
  isRead: boolean
  persistent?: boolean // 수동으로 닫아야 하는 알림
}

interface RealTimeNotificationsProps {
  maxNotifications?: number
  autoHideDelay?: number
  enableSound?: boolean
}

export function RealTimeNotifications({ 
  maxNotifications = 50, 
  autoHideDelay = 5000,
  enableSound = true 
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  const [filter, setFilter] = useState<'all' | 'unread' | 'errors'>('all')
  const [pauseNotifications, setPauseNotifications] = useState(false)

  const webSocket = useWebSocket({
    url: 'ws://localhost:8000/ws/',
    clientId: `notifications-${Date.now()}`,
    enableHeartbeat: true,
  })

  // 알림 소리 재생
  const playNotificationSound = useCallback((type: Notification['type']) => {
    if (!soundEnabled) return
    
    // Web Audio API 사용하여 간단한 알림 소리 생성
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 타입별 다른 주파수
      const frequency = {
        success: 800,
        info: 600,
        upload: 500,
        warning: 400,
        error: 300,
      }[type] || 500
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      console.warn('알림 소리 재생 실패:', e)
    }
  }, [soundEnabled])

  // 새 알림 추가
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    if (pauseNotifications && notification.type !== 'error') return

    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      isRead: false,
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      // 최대 개수 제한
      return updated.slice(0, maxNotifications)
    })

    playNotificationSound(notification.type)

    // 자동 숨기기 (persistent가 아닌 경우)
    if (!notification.persistent && autoHideDelay > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, autoHideDelay)
    }
  }, [pauseNotifications, maxNotifications, autoHideDelay, playNotificationSound])

  // WebSocket 이벤트 리스너들
  useEffect(() => {
    const unsubscribers = [
      // 업로드 진행률 알림
      webSocket.onMessage('upload_progress', (data: any) => {
        addNotification({
          type: 'upload',
          title: `스크립트 #${data.script_id} 업로드`,
          message: data.message,
          scriptId: data.script_id,
          progress: data.progress,
          persistent: data.status === 'error',
        })
      }),

      // YouTube 업로드 상태 알림
      webSocket.onMessage('youtube_status', (data: any) => {
        addNotification({
          type: data.status === 'completed' ? 'success' : 
                data.status === 'error' ? 'error' : 'info',
          title: `YouTube 업로드 #${data.script_id}`,
          message: data.status === 'completed' ? 'YouTube 업로드가 완료되었습니다.' :
                  data.status === 'error' ? `업로드 실패: ${data.error_message}` :
                  data.status === 'uploading' ? 'YouTube에 업로드 중입니다.' :
                  '업로드 대기 중입니다.',
          scriptId: data.script_id,
          youtubeUrl: data.youtube_url,
          progress: data.progress,
          persistent: data.status === 'error',
        })
      }),

      // 시스템 알림
      webSocket.onMessage('system_notification', (data: any) => {
        addNotification({
          type: data.level || 'info',
          title: data.title || '시스템 알림',
          message: data.message,
          persistent: data.level === 'error',
        })
      }),

      // 시스템 상태 변화 알림
      webSocket.onMessage('system_health', (data: any) => {
        if (data.status !== 'ok') {
          addNotification({
            type: 'warning',
            title: '시스템 상태 변화',
            message: `시스템 상태: ${data.status}`,
            persistent: true,
          })
        }
      }),

      // WebSocket 연결 상태 알림
      webSocket.onConnectionChange((isConnected: boolean, status: string) => {
        if (!isConnected) {
          addNotification({
            type: 'warning',
            title: 'WebSocket 연결 끊김',
            message: '실시간 업데이트가 중단되었습니다. 재연결 중...',
            persistent: true,
          })
        } else if (status === 'connected') {
          // 재연결 성공 알림
          setNotifications(prev => prev.filter(n => n.title !== 'WebSocket 연결 끊김'))
          addNotification({
            type: 'success',
            title: 'WebSocket 재연결됨',
            message: '실시간 업데이트가 복구되었습니다.',
          })
        }
      }),
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [webSocket, addNotification])

  // 알림 닫기
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // 모든 알림 닫기
  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  // 읽음으로 표시
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }, [])

  // 모든 알림 읽음으로 표시
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [])

  // 필터링된 알림
  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case 'unread': return !n.isRead
      case 'errors': return n.type === 'error'
      default: return true
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const errorCount = notifications.filter(n => n.type === 'error').length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle2
      case 'error': return AlertTriangle
      case 'warning': return AlertTriangle
      case 'upload': return Upload
      default: return Bell
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'upload': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* 알림 버튼 */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative bg-white shadow-lg border-gray-200 hover:bg-gray-50"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* 알림 패널 */}
        {isExpanded && (
          <Card className="absolute top-12 right-0 w-96 max-h-96 shadow-xl border bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  실시간 알림
                  {unreadCount > 0 && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {unreadCount}개 읽지 않음
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 컨트롤 */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-2"
                >
                  {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  소리
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPauseNotifications(!pauseNotifications)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-3 w-3" />
                  {pauseNotifications ? '재개' : '일시정지'}
                </Button>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">전체</option>
                  <option value="unread">읽지 않음</option>
                  <option value="errors">오류만</option>
                </select>
              </div>

              {/* 액션 버튼들 */}
              {filteredNotifications.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    모두 읽음
                  </Button>
                  <Button variant="outline" size="sm" onClick={dismissAll}>
                    모두 닫기
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 max-h-64 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>새로운 알림이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
                          !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                        } hover:bg-opacity-75 transition-all cursor-pointer`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              
                              {/* 진행률 표시 */}
                              {notification.progress !== undefined && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>진행률</span>
                                    <span>{notification.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${notification.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* YouTube URL */}
                              {notification.youtubeUrl && (
                                <a
                                  href={notification.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Youtube className="h-3 w-3" />
                                  YouTube에서 보기
                                </a>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {notification.timestamp.toLocaleTimeString('ko-KR')}
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              dismissNotification(notification.id)
                            }}
                            className="ml-2 h-6 w-6 p-0 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 에러 알림 토스트 (우선순위 높음) */}
      {notifications
        .filter(n => n.type === 'error' && !n.isRead)
        .slice(0, 3)
        .map((notification, index) => (
          <div
            key={notification.id}
            className={`fixed top-${16 + index * 20} right-4 w-80 bg-red-50 border border-red-200 rounded-lg shadow-lg z-60`}
            style={{ top: `${4 + index * 5}rem` }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">{notification.title}</h4>
                    <p className="text-sm text-red-700 mt-1">{notification.message}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  )
}