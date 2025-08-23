import { useToast } from '@/hooks/useToast'
import { Toast, ToastClose, ToastDescription, ToastTitle } from '@/components/ui/toast'
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const getToastIcon = (variant?: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'destructive':
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
          variant={toast.variant}
          className="animate-in slide-in-from-right-full"
        >
          <div className="flex items-start space-x-3">
            {getToastIcon(toast.variant)}
            <div className="flex-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
          </div>
          <ToastClose onClick={() => dismiss(toast.id)} />
        </Toast>
      ))}
    </div>
  )
}