//import React from 'react' // Removed unused import
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { Toast, ToastType } from '@/types/toast'

/**
 * Toast Container 컴포넌트
 * 실제 Toast UI 렌더링
 * React Refresh 호환성을 위해 별도 파일로 분리
 */
interface ToastContainerProps {
  toasts: Toast[]
  onHideToast: (_id: string) => void
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export function ToastContainer({ toasts, onHideToast, position }: ToastContainerProps) {
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
      default:
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
      default:
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