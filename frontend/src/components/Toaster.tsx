import { useToastContext } from '@/hooks/useToastContext'
import { Toast, ToastClose, ToastDescription, ToastTitle } from '@/components/ui/toast'
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

/**
 * Phase 2: Toast 시스템 통합 - Context 기반으로 마이그레이션
 * Legacy useToast → useToastContext 통합
 */
export function Toaster() {
  const { toasts, hideToast } = useToastContext()

  const getToastIcon = (type?: string) => {
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
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="fixed top-0 right-0 z-50 w-full max-w-sm p-4 space-y-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.type === 'error' ? 'destructive' : toast.type}
          className="animate-in slide-in-from-right-full"
        >
          <div className="flex items-start space-x-3">
            {getToastIcon(toast.type)}
            <div className="flex-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.message && (
                <ToastDescription>{toast.message}</ToastDescription>
              )}
            </div>
          </div>
          <ToastClose onClick={() => hideToast(toast.id)} />
        </Toast>
      ))}
    </div>
  )
}