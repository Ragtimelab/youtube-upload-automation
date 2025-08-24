/**
 * 표준화된 에러 처리 Hook
 * 애플리케이션 전반의 에러를 일관되게 처리하고 사용자에게 표시
 */

import { useState, useCallback } from 'react'
import { useToast } from './useToast'
import { logApiError, getUserFriendlyErrorMessage, isQuotaError, isNetworkError } from '@/utils/apiUtils'
import type { LoadingState } from '@/types'

interface ErrorInfo {
  message: string
  code?: string
  statusCode?: number
  timestamp: Date
  context?: string
  originalError?: unknown
}

interface UseErrorHandlerReturn {
  // 상태
  error: ErrorInfo | null
  hasError: boolean
  isLoading: boolean
  loadingState: LoadingState
  
  // 액션
  setError: (_error: unknown, _context?: string) => void
  clearError: () => void
  setLoading: (_loading: boolean) => void
  setLoadingState: (_state: LoadingState) => void
  
  // 에러 처리 래퍼 함수들
  handleAsync: <T>(
    _asyncFn: () => Promise<T>, 
    _context?: string,
    _showToast?: boolean
  ) => Promise<T | undefined>
  handleApiCall: <T>(
    _apiCall: () => Promise<T>,
    _context?: string,
    _options?: {
      showSuccessToast?: boolean
      successMessage?: string
      toastError?: boolean
      retryOnError?: boolean
      retryCount?: number
    }
  ) => Promise<T | undefined>
  
  // 특정 에러 타입 체크
  isQuotaError: () => boolean
  isNetworkError: () => boolean
  
  // 에러 재시도
  retry: (_fn: () => Promise<unknown> | void, _context?: string) => Promise<void>
}

export function useErrorHandler(defaultContext?: string): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<ErrorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingStateInternal] = useState<LoadingState>('idle')
  const { success, error: errorToast } = useToast()
  
  const setError = useCallback((err: unknown, context?: string) => {
    const errorInfo: ErrorInfo = {
      message: getUserFriendlyErrorMessage(err),
      timestamp: new Date(),
      context: context || defaultContext,
      originalError: err
    }
    
    // HTTP 상태 코드 추출
    if (err && typeof err === 'object' && 'status' in err) {
      errorInfo.statusCode = err.status as number
    }
    
    // 에러 코드 추출
    if (err && typeof err === 'object' && 'code' in err) {
      errorInfo.code = err.code as string
    }
    
    setErrorState(errorInfo)
    setLoadingStateInternal('error')
    
    // API 에러 로깅
    if (context || defaultContext) {
      logApiError(context || defaultContext || 'Unknown', err)
    }
  }, [defaultContext])
  
  const clearError = useCallback(() => {
    setErrorState(null)
    if (loadingState === 'error') {
      setLoadingStateInternal('idle')
    }
  }, [loadingState])
  
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
    if (loading) {
      setLoadingStateInternal('loading')
      clearError()
    } else if (loadingState === 'loading') {
      setLoadingStateInternal('success')
    }
  }, [loadingState, clearError])
  
  const setLoadingState = useCallback((state: LoadingState) => {
    setLoadingStateInternal(state)
    setIsLoading(state === 'loading')
    
    if (state !== 'error') {
      setErrorState(null)
    }
  }, [])
  
  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    showToast: boolean = true
  ): Promise<T | undefined> => {
    try {
      setLoading(true)
      const result = await asyncFn()
      setLoadingState('success')
      return result
    } catch (err) {
      setError(err, context)
      if (showToast) {
        errorToast('오류', getUserFriendlyErrorMessage(err))
      }
      return undefined
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading, setLoadingState, errorToast])
  
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    context?: string,
    options: {
      showSuccessToast?: boolean
      successMessage?: string
      toastError?: boolean
      retryOnError?: boolean
      retryCount?: number
    } = {}
  ): Promise<T | undefined> => {
    const {
      showSuccessToast = false,
      successMessage = '작업이 완료되었습니다.',
      toastError = true,
      retryOnError = false,
      retryCount = 3
    } = options
    
    let attempts = 0
    
    const attemptCall = async (): Promise<T | undefined> => {
      attempts++
      
      try {
        setLoading(true)
        const result = await apiCall()
        setLoadingState('success')
        
        if (showSuccessToast) {
          success('성공', successMessage)
        }
        
        return result
      } catch (err) {
        setError(err, context)
        
        // 재시도 로직
        if (retryOnError && attempts < retryCount && (isNetworkError(err) || isQuotaError(err))) {
          console.log(`API 호출 재시도 중... (${attempts}/${retryCount})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          return attemptCall()
        }
        
        if (toastError) {
          errorToast('오류', getUserFriendlyErrorMessage(err))
        }
        
        return undefined
      } finally {
        setLoading(false)
      }
    }
    
    return attemptCall()
  }, [setError, setLoading, setLoadingState, success, errorToast])
  
  const checkIsQuotaError = useCallback(() => {
    return error ? isQuotaError(error.originalError) : false
  }, [error])
  
  const checkIsNetworkError = useCallback(() => {
    return error ? isNetworkError(error.originalError) : false
  }, [error])
  
  const retry = useCallback(async (fn: () => Promise<unknown> | void, context?: string) => {
    clearError()
    try {
      setLoading(true)
      await fn()
      setLoadingState('success')
    } catch (err) {
      setError(err, context)
    } finally {
      setLoading(false)
    }
  }, [clearError, setError, setLoading, setLoadingState])
  
  return {
    // 상태
    error,
    hasError: !!error,
    isLoading,
    loadingState,
    
    // 액션
    setError,
    clearError,
    setLoading,
    setLoadingState,
    
    // 래퍼 함수들
    handleAsync,
    handleApiCall,
    
    // 에러 타입 체크
    isQuotaError: checkIsQuotaError,
    isNetworkError: checkIsNetworkError,
    
    // 재시도
    retry
  }
}

// 글로벌 에러 처리를 위한 컨텍스트 훅
export function useGlobalErrorHandler() {
  return useErrorHandler('Global')
}

// API 에러 전용 훅  
export function useApiErrorHandler(context: string) {
  const errorHandler = useErrorHandler(context)
  
  const handleApiCall = useCallback(<T>(apiCall: () => Promise<T>) => {
    return errorHandler.handleApiCall(apiCall, context, {
      toastError: true,
      retryOnError: true,
      retryCount: 3
    })
  }, [errorHandler, context])
  
  return {
    ...errorHandler,
    handleApiCall
  }
}

// 폼 에러 처리를 위한 훅
export function useFormErrorHandler() {
  const errorHandler = useErrorHandler('Form')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])
  
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [])
  
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])
  
  return {
    ...errorHandler,
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0
  }
}