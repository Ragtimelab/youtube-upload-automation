/**
 * 알림 시스템 관련 타입 정의
 */

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

export interface UploadProgressMessage {
  script_id: number
  message: string
  progress: number
  status: string
}

export interface YouTubeStatusMessage {
  script_id: number
  status: 'completed' | 'error' | 'uploading' | 'pending'
  error_message?: string
  youtube_url?: string
  progress?: number
}

export interface SystemNotificationMessage {
  level: 'info' | 'warning' | 'error'
  title?: string
  message: string
}

export interface SystemHealthMessage {
  status: string
}

export interface NotificationSettings {
  maxNotifications: number
  autoHideDelay: number
  enableSound: boolean
}