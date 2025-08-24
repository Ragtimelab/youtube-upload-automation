import React, { createContext, useContext, useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * React 19 최적화된 전역 Toast 상태 관리
 * Props drilling 완전 제거, 자동 생명주기 관리
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

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
  hideAllToasts: () => void
  updateToast: (id: string, updates: Partial<Toast>) => void
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const ToastContext = createContext<ToastContextValue | null>(null)

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

  // Toast 추가
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
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
  }, [maxToasts, defaultDuration])

  // Toast 숨기기
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
    
    // 타이머 정리
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
  }, [])

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
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutRefs.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} position={position} />
    </ToastContext.Provider>
  )
}

/**
 * Toast Context 훅
 */
export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}

/**
 * 간편한 Toast 호출 훅
 * 자주 사용하는 Toast 타입별 편의 함수 제공
 */
export function useToastHelpers() {
  const { showToast } = useToast()
  
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
 * Toast Container 컴포넌트
 * 실제 Toast UI 렌더링
 */
interface ToastContainerProps {
  toasts: Toast[]
  onHideToast: (id: string) => void
  position: ToastProviderProps['position']
}

function ToastContainer({ toasts, onHideToast, position }: ToastContainerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className={`fixed z-50 pointer-events-none ${getPositionClasses()}`}>
      <div className="space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-80 rounded-lg border shadow-lg 
              ${getToastColors(toast.type)}
              transform transition-all duration-300 ease-in-out
              ${index === 0 ? 'translate-x-0 scale-100' : 'translate-x-0 scale-95'}
            `}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getToastIcon(toast.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {toast.title}
                    </h4>
                    {toast.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {toast.message}
                      </p>
                    )}
                    
                    {/* 진행률 표시 */}
                    {toast.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>진행률</span>
                          <span>{toast.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, toast.progress))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 액션 버튼 */}
                    {toast.action && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toast.action.onClick}
                          className="text-xs"
                        >
                          {toast.action.label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHideToast(toast.id)}
                  className="ml-2 h-6 w-6 p-0 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Toast 알림 상태 추적 훅
 * 특정 작업의 Toast 상태를 추적할 때 사용
 */
export function useToastProgress() {
  const { showToast, updateToast, hideToast } = useToast()
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