/**
 * 알림 목록 렌더링 컴포넌트
 * 필터링, 읽음/읽지 않음 상태 관리, UI 표시 담당
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Youtube, 
  X, 
  Clock,
  Info
} from 'lucide-react'
import type { Notification } from './types'

interface NotificationListProps {
  notifications: Notification[]
  filter: 'all' | 'unread' | 'errors'
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

export function NotificationList({
  notifications,
  filter,
  onMarkAsRead,
  onDismiss
}: NotificationListProps) {
  // 알림 필터링
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'errors') return notification.type === 'error'
    return true
  })

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'upload':
        return <Upload className="h-4 w-4 text-blue-600" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'upload':
        return 'bg-blue-50 border-blue-200'
      case 'info':
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {filter === 'unread' && '읽지 않은 알림이 없습니다.'}
        {filter === 'errors' && '오류 알림이 없습니다.'}
        {filter === 'all' && '알림이 없습니다.'}
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {filteredNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all duration-200 ${
            getNotificationColor(notification.type)
          } ${!notification.isRead ? 'ring-1 ring-blue-500/20' : ''}`}
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">
                    {notification.title}
                  </h4>
                  {notification.scriptId && (
                    <Badge variant="outline" className="text-xs">
                      #{notification.scriptId}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 break-words">
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
                onDismiss(notification.id)
              }}
              className="ml-2 h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}