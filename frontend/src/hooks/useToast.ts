import { useState, useCallback } from 'react'
import { UI_CONSTANTS } from '@/constants/ui'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  duration?: number
}

export interface ToastContextValue {
  toasts: Toast[]
  toast: (_props: Omit<Toast, 'id'>) => string
  dismiss: (_toastId?: string) => void
}

const TOAST_LIMIT = UI_CONSTANTS.LIMITS.MAX_TOAST_COUNT
// const TOAST_REMOVE_DELAY = 1000000

let toastCount = 0

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER
  return toastCount.toString()
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = genId()
    const { duration = UI_CONSTANTS.TOAST_DURATION.default, ...rest } = props

    const newToast: Toast = {
      ...rest,
      id,
      duration,
    }

    setToasts((prev) => {
      const newToasts = [...prev, newToast]
      
      // Limit number of toasts
      if (newToasts.length > TOAST_LIMIT) {
        return newToasts.slice(-TOAST_LIMIT)
      }
      
      return newToasts
    })

    // Auto dismiss
    if (duration && duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    }

    return id
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) => {
      if (toastId) {
        return prev.filter((toast) => toast.id !== toastId)
      } else {
        return []
      }
    })
  }, [])

  // Helper functions for common toast types
  const success = useCallback((title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'success',
    })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'destructive',
      duration: UI_CONSTANTS.TOAST_DURATION.error,
    })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'warning',
    })
  }, [toast])

  const info = useCallback((title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'info',
    })
  }, [toast])

  return {
    toasts,
    toast,
    dismiss,
    success,
    error,
    warning,
    info,
  }
}