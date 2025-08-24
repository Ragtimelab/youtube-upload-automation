import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * React 19 최적화된 재시도 훅
 * 글로벌 원칙: 근본 해결 - 네트워크 실패, 서버 오류에 대한 체계적 복구
 */

export type BackoffStrategy = 'linear' | 'exponential' | 'fixed'

export interface RetryConfig {
  maxAttempts: number
  backoffStrategy: BackoffStrategy
  baseDelay: number // 밀리초
  maxDelay: number  // 최대 지연 시간
  retryCondition?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number) => void
  onMaxAttemptsReached?: (error: any) => void
}

export interface RetryState {
  isRetrying: boolean
  currentAttempt: number
  lastError: any
  hasReachedMaxAttempts: boolean
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  baseDelay: 1000,
  maxDelay: 30000,
  retryCondition: (error: any) => {
    // 기본적으로 네트워크 에러와 5xx 서버 에러만 재시도
    if (error?.message?.includes('Network Error')) return true
    if (error?.response?.status >= 500) return true
    if (error?.code === 'ECONNABORTED') return true // 타임아웃
    return false
  }
}

export function useRetry<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config }
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    hasReachedMaxAttempts: false
  })

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 지연 시간 계산 함수
  const calculateDelay = useCallback((attempt: number, strategy: BackoffStrategy, baseDelay: number, maxDelay: number): number => {
    let delay: number

    switch (strategy) {
      case 'linear':
        delay = baseDelay * attempt
        break
      case 'exponential':
        delay = baseDelay * Math.pow(2, attempt - 1)
        break
      case 'fixed':
      default:
        delay = baseDelay
        break
    }

    // 지터(jitter) 추가로 thundering herd 문제 방지
    const jitter = Math.random() * 0.1 * delay
    delay += jitter

    return Math.min(delay, maxDelay)
  }, [])

  // 메인 실행 함수
  const execute = useCallback(async (...args: T): Promise<R> => {
    const { maxAttempts, backoffStrategy, baseDelay, maxDelay, retryCondition, onRetry, onMaxAttemptsReached } = finalConfig

    let lastError: any = null
    let attempt = 1

    // 상태 초기화
    if (!isUnmountedRef.current) {
      setState({
        isRetrying: false,
        currentAttempt: 0,
        lastError: null,
        hasReachedMaxAttempts: false
      })
    }

    while (attempt <= maxAttempts) {
      try {
        // 현재 시도 상태 업데이트
        if (!isUnmountedRef.current) {
          setState(prev => ({
            ...prev,
            currentAttempt: attempt,
            isRetrying: attempt > 1
          }))
        }

        const result = await asyncFunction(...args)
        
        // 성공 시 상태 정리
        if (!isUnmountedRef.current) {
          setState({
            isRetrying: false,
            currentAttempt: 0,
            lastError: null,
            hasReachedMaxAttempts: false
          })
        }

        return result

      } catch (error) {
        lastError = error
        
        // 재시도 조건 확인 (글로벌 원칙: 추측 금지 - 명확한 조건 기반 판단)
        const shouldRetry = retryCondition ? retryCondition(error, attempt) : true
        
        if (attempt >= maxAttempts || !shouldRetry) {
          // 최대 시도 횟수 도달 또는 재시도 불가능한 에러
          if (!isUnmountedRef.current) {
            setState(prev => ({
              ...prev,
              isRetrying: false,
              lastError: error,
              hasReachedMaxAttempts: attempt >= maxAttempts
            }))
          }

          if (onMaxAttemptsReached && attempt >= maxAttempts) {
            onMaxAttemptsReached(error)
          }

          throw error
        }

        // 재시도 콜백 실행
        if (onRetry) {
          onRetry(error, attempt)
        }

        // 지연 후 다음 시도
        if (attempt < maxAttempts) {
          const delay = calculateDelay(attempt, backoffStrategy, baseDelay, maxDelay)
          
          await new Promise<void>((resolve) => {
            timeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) {
                resolve()
              }
            }, delay)
          })
        }

        attempt++
      }
    }

    // 이 지점에 도달하면 안 되지만, TypeScript 안전성을 위해
    throw lastError
  }, [asyncFunction, finalConfig, calculateDelay])

  // 수동 재시도 함수
  const retry = useCallback((...args: T) => {
    return execute(...args)
  }, [execute])

  // 상태 초기화 함수
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      hasReachedMaxAttempts: false
    })
  }, [])

  return {
    execute,
    retry,
    reset,
    ...state
  }
}

/**
 * YouTube API 전용 재시도 훅
 * YouTube API의 특수한 제약사항들을 고려한 설정
 */
export function useYouTubeRetry<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  const youTubeConfig: Partial<RetryConfig> = {
    maxAttempts: 5, // YouTube API는 더 많은 재시도 허용
    backoffStrategy: 'exponential',
    baseDelay: 2000, // 더 긴 기본 지연
    maxDelay: 60000, // 최대 1분
    retryCondition: (error: any, attempt: number) => {
      const status = error?.response?.status

      // 절대 재시도하지 않을 에러들
      if (status === 400) return false // Bad Request
      if (status === 401) return false // Unauthorized
      if (status === 403 && error?.response?.data?.error?.reason === 'quotaExceeded') return false // 할당량 초과
      if (status === 404) return false // Not Found

      // 재시도할 에러들
      if (status === 403 && error?.response?.data?.error?.reason === 'rateLimitExceeded') return true // Rate limit
      if (status >= 500) return true // 서버 에러
      if (error?.message?.includes('Network Error')) return true
      if (error?.code === 'ECONNABORTED') return true

      return false
    },
    onRetry: (error: any, attempt: number) => {
      console.warn(`YouTube API 재시도 ${attempt}번째:`, {
        status: error?.response?.status,
        reason: error?.response?.data?.error?.reason,
        message: error?.message
      })
    },
    ...config
  }

  return useRetry(asyncFunction, youTubeConfig)
}

/**
 * 파일 업로드 전용 재시도 훅
 * 대용량 파일 업로드의 네트워크 불안정성을 고려한 설정
 */
export function useUploadRetry<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  const uploadConfig: Partial<RetryConfig> = {
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 5000, // 업로드는 더 긴 지연
    maxDelay: 120000, // 최대 2분
    retryCondition: (error: any) => {
      const status = error?.response?.status

      // 클라이언트 에러는 재시도 안함
      if (status >= 400 && status < 500) return false
      
      // 네트워크 에러나 서버 에러만 재시도
      return (
        error?.message?.includes('Network Error') ||
        error?.code === 'ECONNABORTED' ||
        status >= 500
      )
    },
    onRetry: (error: any, attempt: number) => {
      console.warn(`파일 업로드 재시도 ${attempt}번째:`, error?.message || error)
    },
    ...config
  }

  return useRetry(asyncFunction, uploadConfig)
}