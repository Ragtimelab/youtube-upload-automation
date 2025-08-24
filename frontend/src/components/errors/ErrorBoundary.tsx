import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * React 19 최적화된 전역 ErrorBoundary
 * 글로벌 원칙: 근본 해결 - 에러 복구 메커니즘과 사용자 액션 제공
 */

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (_error: Error, _retry: () => void) => ReactNode
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void
  maxRetries?: number
  level?: 'global' | 'page' | 'component'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 에러 발생 시 상태 업데이트 (글로벌 원칙: 추측 금지 - 실제 에러 정보 기반)
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 정보 저장 및 리포팅 (글로벌 원칙: 실시간 검증)
    this.setState({
      errorInfo
    })

    // 사용자 정의 에러 핸들러 실행
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 개발 환경에서 상세 로깅
    if (process.env['NODE_ENV'] === 'development') {
      console.group(`🚨 ErrorBoundary (${this.props.level || 'unknown'})`)
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error Boundary Info:', {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        level: this.props.level
      })
      console.groupEnd()
    }

    // 에러 리포팅 서비스 연동 (프로덕션 환경)
    if (process.env['NODE_ENV'] === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  // 에러 리포팅 메서드 (외부 서비스 연동 준비)
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // TODO: 에러 리포팅 서비스 (Sentry, LogRocket 등) 연동
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'unknown'
    }

    // 임시로 localStorage에 저장 (추후 외부 서비스로 전송)
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-reports') || '[]')
      existingErrors.push(errorReport)
      
      // 최대 50개 에러만 보관
      if (existingErrors.length > 50) {
        existingErrors.shift()
      }
      
      localStorage.setItem('error-reports', JSON.stringify(existingErrors))
    } catch (storageError) {
      console.error('Failed to store error report:', storageError)
    }
  }

  // 재시도 메서드 (지수 백오프 적용)
  private retry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      console.warn(`Max retry attempts (${maxRetries}) reached for ErrorBoundary`)
      return
    }

    // 지수 백오프 지연 (1초, 2초, 4초...)
    const delayMs = Math.min(1000 * Math.pow(2, retryCount), 8000)

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      })
    }, delayMs)
  }

  override componentWillUnmount() {
    // 타이머 정리
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  override render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, maxRetries = 3, level = 'component' } = this.props

    if (hasError && error) {
      // 사용자 정의 fallback이 있는 경우
      if (fallback) {
        return fallback(error, this.retry)
      }

      // 기본 에러 UI
      return <DefaultErrorFallback 
        error={error}
        retry={this.retry}
        canRetry={retryCount < maxRetries}
        retryCount={retryCount}
        level={level}
      />
    }

    return children
  }
}

/**
 * 기본 에러 UI 컴포넌트
 */
interface DefaultErrorFallbackProps {
  error: Error
  retry: () => void
  canRetry: boolean
  retryCount: number
  level: 'global' | 'page' | 'component'
}

export function DefaultErrorFallback({ error, retry, canRetry, retryCount, level }: DefaultErrorFallbackProps) {
  const navigate = useNavigate()

  const getLevelInfo = () => {
    switch (level) {
      case 'global':
        return {
          title: '시스템 오류가 발생했습니다',
          description: '전체 애플리케이션에 문제가 발생했습니다.',
          severity: 'high' as const
        }
      case 'page':
        return {
          title: '페이지 로딩 중 오류가 발생했습니다',
          description: '현재 페이지에 문제가 발생했습니다.',
          severity: 'medium' as const
        }
      case 'component':
        return {
          title: '일부 기능에 오류가 발생했습니다',
          description: '특정 컴포넌트에 문제가 발생했습니다.',
          severity: 'low' as const
        }
    }
  }

  const levelInfo = getLevelInfo()
  const isHighSeverity = levelInfo.severity === 'high'

  return (
    <div className={`
      flex flex-col items-center justify-center p-8 
      ${isHighSeverity ? 'min-h-screen bg-red-50' : 'min-h-[400px] bg-gray-50'} 
      rounded-lg border border-red-200
    `}>
      <div className="text-center max-w-md">
        {/* 아이콘 */}
        <div className={`
          mx-auto mb-4 flex items-center justify-center rounded-full
          ${isHighSeverity ? 'h-16 w-16 bg-red-100' : 'h-12 w-12 bg-red-100'}
        `}>
          <AlertTriangle className={`${isHighSeverity ? 'h-8 w-8' : 'h-6 w-6'} text-red-600`} />
        </div>

        {/* 제목 */}
        <h2 className={`
          mb-2 font-semibold text-gray-900
          ${isHighSeverity ? 'text-xl' : 'text-lg'}
        `}>
          {levelInfo.title}
        </h2>

        {/* 설명 */}
        <p className="mb-4 text-sm text-gray-600">
          {levelInfo.description}
        </p>

        {/* 에러 메시지 (개발 환경에서만) */}
        {process.env['NODE_ENV'] === 'development' && (
          <div className="mb-4 p-3 bg-red-100 rounded border text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* 재시도 정보 */}
        {retryCount > 0 && (
          <p className="mb-4 text-xs text-gray-500">
            재시도 횟수: {retryCount}번
          </p>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {canRetry && (
            <button
              onClick={retry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            홈으로
          </button>

          {level !== 'global' && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 페이지
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// withErrorBoundary HOC는 별도 파일로 분리 (React Refresh 호환성)