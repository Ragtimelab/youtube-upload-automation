import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { ToastContainer } from '@/components/ui/ToastContainer'
import {
  ToastContext,
  createToastId,
  type Toast,
  type ToastContextValue,
  type ToastProviderProps
} from '@/types/toast'

/**
 * React 19 최적화된 전역 Toast 상태 관리
 * Props drilling 완전 제거, 자동 생명주기 관리
 */

/**
 * Toast Provider 컴포넌트
 * 전역 Toast 상태 관리 및 UI 렌더링
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 4000,
  position = 'top-right'
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Toast 숨기기 (먼저 정의하여 showToast에서 사용 가능)
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    
    // 타이머 정리
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
  }, [])

  // Toast 추가
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = createToastId()
    const duration = toast.duration ?? defaultDuration
    
    const newToast: Toast = {
      ...toast,
      id,
      duration
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      // 최대 개수 제한
      return updated.slice(0, maxToasts)
    })

    // 자동 숨기기 (persistent가 아닌 경우)
    if (!toast.persistent && duration > 0) {
      const timeoutId = setTimeout(() => {
        hideToast(id)
      }, duration)
      
      timeoutRefs.current.set(id, timeoutId)
    }

    return id
  }, [maxToasts, defaultDuration, hideToast])

  // 모든 Toast 숨기기
  const hideAllToasts = useCallback(() => {
    setToasts([])
    // 모든 타이머 정리
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
    timeoutRefs.current.clear()
  }, [])

  // Toast 업데이트
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  // Context 값 최적화
  const contextValue = useMemo<ToastContextValue>(() => ({
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    updateToast
  }), [toasts, showToast, hideToast, hideAllToasts, updateToast])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    // ref 값을 effect 내에서 복사하여 cleanup에서 안전하게 사용
    const currentTimeouts = timeoutRefs.current
    return () => {
      currentTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
      currentTimeouts.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} position={position} />
    </ToastContext.Provider>
  )
}

// Toast 관련 훅들과 컴포넌트들은 다음 위치로 분리됨:
// - 훅들: @/hooks/useToastContext
// - 컴포넌트들: @/components/ui/ToastContainer