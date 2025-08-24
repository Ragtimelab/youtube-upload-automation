/**
 * 에러 알림 토스트 컴포넌트
 * 우선순위 높은 에러 알림을 화면 상단에 표시
 */

import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import type { Notification } from './types'

interface ErrorToastProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  maxToasts?: number
}

export function ErrorToast({ 
  notifications, 
  onDismiss, 
  maxToasts = 3 
}: ErrorToastProps) {
  // 에러 알림만 필터링하고 읽지 않은 것만 표시
  const errorNotifications = notifications
    .filter(n => n.type === 'error' && !n.isRead)
    .slice(0, maxToasts)

  if (errorNotifications.length === 0) return null

  return (
    <>
      {errorNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="fixed right-4 w-80 bg-red-50 border border-red-200 rounded-lg shadow-lg z-60 animate-in slide-in-from-right duration-300"
          style={{ top: `${4 + index * 5}rem` }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-red-900 break-words">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-red-700 mt-1 break-words">
                    {notification.message}
                  </p>
                  {notification.scriptId && (
                    <p className="text-xs text-red-600 mt-1">
                      스크립트 #{notification.scriptId}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="text-red-600 hover:text-red-800 h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}