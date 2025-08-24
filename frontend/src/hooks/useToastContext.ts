import { useContext, useMemo, useState, useCallback } from 'react'
import { ToastContext } from '@/types/toast'
import type { Toast } from '@/types/toast'

/**
 * Toast Context 훅
 * React Refresh 호환성을 위해 별도 파일로 분리
 */
export function useToastContext() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  
  return context
}

/**
 * 간편한 Toast 호출 훅
 * 자주 사용하는 Toast 타입별 편의 함수 제공
 */
export function useToastHelpers() {
  const { showToast } = useToastContext()
  
  return useMemo(() => ({
    success: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'error', title, message, persistent: true, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'info', title, message, ...options }),
    
    // 진행률 Toast (업로드 등에 사용)
    progress: (title: string, progress: number, options?: Partial<Toast>) =>
      showToast({ type: 'info', title, progress, persistent: true, ...options })
  }), [showToast])
}

/**
 * Toast 알림 상태 추적 훅
 * 특정 작업의 Toast 상태를 추적할 때 사용
 */
export function useToastProgress() {
  const { showToast, updateToast, hideToast } = useToastContext()
  const [activeToastId, setActiveToastId] = useState<string | null>(null)
  
  const startProgress = useCallback((title: string, initialProgress = 0) => {
    const id = showToast({
      type: 'info',
      title,
      progress: initialProgress,
      persistent: true
    })
    setActiveToastId(id)
    return id
  }, [showToast])
  
  const updateProgress = useCallback((progress: number, message?: string) => {
    if (activeToastId) {
      updateToast(activeToastId, {
        progress,
        ...(message && { message })
      })
    }
  }, [activeToastId, updateToast])
  
  const finishProgress = useCallback((success = true, finalMessage?: string) => {
    if (activeToastId) {
      if (success) {
        updateToast(activeToastId, {
          type: 'success',
          progress: 100,
          message: finalMessage || '완료되었습니다.',
          persistent: false,
          duration: 3000
        })
      } else {
        updateToast(activeToastId, {
          type: 'error', 
          message: finalMessage || '실패했습니다.',
          persistent: true
        })
      }
      
      // success인 경우 3초 후 자동 제거
      if (success) {
        setTimeout(() => {
          hideToast(activeToastId)
          setActiveToastId(null)
        }, 3000)
      }
    }
  }, [activeToastId, updateToast, hideToast])
  
  return {
    startProgress,
    updateProgress,
    finishProgress,
    activeToastId
  }
}