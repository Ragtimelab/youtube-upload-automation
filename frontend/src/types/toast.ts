import { createContext } from 'react'

/**
 * Toast 관련 타입 정의
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  progress?: number
}

export interface ToastContextValue {
  toasts: Toast[]
  showToast: (_toast: Omit<Toast, 'id'>) => string
  hideToast: (_id: string) => void
  hideAllToasts: () => void
  updateToast: (_id: string, _updates: Partial<Toast>) => void
}

export interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ToastContext = createContext<ToastContextValue | null>(null)

// Toast 유틸리티 함수들
export const createToastId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const DEFAULT_TOAST_DURATION = 5000
export const MAX_TOASTS = 5

// Toast 타입별 기본 설정
export const TOAST_DEFAULTS: Record<ToastType, Partial<Toast>> = {
  success: {
    duration: DEFAULT_TOAST_DURATION,
    persistent: false
  },
  error: {
    duration: 0, // 에러는 수동으로만 닫기
    persistent: true
  },
  warning: {
    duration: DEFAULT_TOAST_DURATION * 1.5, // 경고는 조금 더 오래
    persistent: false
  },
  info: {
    duration: DEFAULT_TOAST_DURATION,
    persistent: false
  }
}