/**
 * 표준화된 에러 표시 컴포넌트들
 * 일관된 에러 상태 표시를 위한 재사용 가능한 컴포넌트들
 */

import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { commonLayouts, statusColors, cn } from '@/utils/classNames'
import { getUserFriendlyErrorMessage } from '@/utils/apiUtils'

// 에러 컴포넌트 기본 Props 타입
interface BaseErrorProps {
  className?: string
  error?: string | Error | unknown
  title?: string
  description?: string
}

// 인라인 에러 컴포넌트
interface InlineErrorProps extends BaseErrorProps {
  variant?: 'destructive' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
}

export function InlineError({ 
  className,
  error,
  title = '오류 발생',
  description,
  variant = 'destructive',
  dismissible = false,
  onDismiss
}: InlineErrorProps) {
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : description || '알 수 없는 오류가 발생했습니다.'

  return (
    <Alert className={cn(
      variant === 'destructive' && statusColors.error.bg + ' ' + statusColors.error.border,
      variant === 'warning' && statusColors.warning.bg + ' ' + statusColors.warning.border,
      variant === 'info' && statusColors.info.bg + ' ' + statusColors.info.border,
      'border',
      className
    )}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {title}
        {dismissible && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 ml-2"
          >
            ✕
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  )
}

// 카드 에러 컴포넌트
interface CardErrorProps extends BaseErrorProps {
  ___onRetry?: () => void
  showRetry?: boolean
  retryLabel?: string
}

export function CardError({ 
  className,
  error,
  title = '데이터를 불러올 수 없습니다',
  description,
  ___onRetry,
  showRetry = true,
  retryLabel = '다시 시도'
}: CardErrorProps) {
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : description || '네트워크 연결을 확인하고 다시 시도해주세요.'

  return (
    <div className={cn(commonLayouts.card, 'p-8', className)}>
      <div className={commonLayouts.flexColCenter}>
        <div className={cn(
          'p-3 rounded-full mb-4',
          statusColors.error.bg,
          statusColors.error.border,
          'border'
        )}>
          <AlertCircle className={cn('h-6 w-6', statusColors.error.text)} />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
          {errorMessage}
        </p>
        
        {showRetry && ___onRetry && (
          <Button
            onClick={___onRetry}
            className={commonLayouts.flexGapSm}
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// 전체 화면 에러 컴포넌트
interface FullScreenErrorProps extends BaseErrorProps {
  ___onRetry?: () => void
  onHome?: () => void
  onBack?: () => void
  showActions?: boolean
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'primary' | 'secondary'
  }>
}

export function FullScreenError({ 
  className,
  error,
  title = '문제가 발생했습니다',
  description,
  ___onRetry,
  onHome,
  onBack,
  showActions = true,
  actions
}: FullScreenErrorProps) {
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : description || '페이지를 불러오는 중 오류가 발생했습니다.'

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 flex items-center justify-center px-4',
      className
    )}>
      <div className="max-w-md w-full text-center">
        <div className={cn(
          'p-4 rounded-full inline-flex mb-6',
          statusColors.error.bg,
          statusColors.error.border,
          'border'
        )}>
          <AlertCircle className={cn('h-12 w-12', statusColors.error.text)} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {errorMessage}
        </p>
        
        {showActions && (
          <div className="space-y-3">
            {actions ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant === 'primary' ? 'default' : action.variant}
                  className="w-full"
                >
                  {action.label}
                </Button>
              ))
            ) : (
              <>
                {___onRetry && (
                  <Button
                    onClick={___onRetry}
                    className={cn('w-full', commonLayouts.flexGapSm)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    다시 시도
                  </Button>
                )}
                
                <div className={cn('flex gap-3', ___onRetry ? 'mt-3' : '')}>
                  {onBack && (
                    <Button
                      onClick={onBack}
                      variant="outline"
                      className={cn('flex-1', commonLayouts.flexGapSm)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      뒤로가기
                    </Button>
                  )}
                  
                  {onHome && (
                    <Button
                      onClick={onHome}
                      variant="outline"
                      className={cn('flex-1', commonLayouts.flexGapSm)}
                    >
                      <Home className="h-4 w-4" />
                      홈으로
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 네트워크 에러 컴포넌트
interface NetworkErrorProps extends BaseErrorProps {
  ___onRetry?: () => void
}

export function NetworkError({ 
  className,
  error,
  title = '연결 문제',
  description
}: NetworkErrorProps) {
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : description || '인터넷 연결을 확인하고 다시 시도해주세요.'

  return (
    <InlineError
      className={className}
      error={errorMessage}
      title={title}
      variant="warning"
    />
  )
}

// API 에러 컴포넌트
interface ApiErrorProps extends BaseErrorProps {
  statusCode?: number
  ___onRetry?: () => void
  ___showSupport?: boolean
}

export function ApiError({ 
  className,
  error,
  title,
  description,
  statusCode
}: ApiErrorProps) {
  const errorMessage = error ? getUserFriendlyErrorMessage(error) : description
  
  const getDefaultTitle = () => {
    if (title) return title
    if (statusCode) {
      switch (statusCode) {
        case 400: return '잘못된 요청'
        case 401: return '인증 필요'
        case 403: return '접근 권한 없음'
        case 404: return '페이지를 찾을 수 없음'
        case 429: return '너무 많은 요청'
        case 500: return '서버 오류'
        default: return 'API 오류'
      }
    }
    return 'API 오류'
  }

  return (
    <CardError
      className={className}
      error={errorMessage}
      title={getDefaultTitle()}
      showRetry={false}
    />
  )
}

// 빈 상태 컴포넌트 (에러는 아니지만 관련 상태)
interface EmptyStateProps {
  className?: string
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
}

export function EmptyState({ 
  className,
  title = '데이터가 없습니다',
  description = '표시할 항목이 없습니다.',
  action,
  icon: Icon = AlertCircle
}: EmptyStateProps) {
  return (
    <div className={cn(commonLayouts.card, 'p-8', className)}>
      <div className={commonLayouts.flexColCenter}>
        <div className={cn(
          'p-3 rounded-full mb-4',
          statusColors.gray.bg,
          statusColors.gray.border,
          'border'
        )}>
          <Icon className={cn('h-6 w-6', statusColors.gray.text)} />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 text-center">
          {description}
        </p>
        
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// 에러 경계 대체 컴포넌트
interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <FullScreenError
      error={error}
      title="예상치 못한 오류가 발생했습니다"
      description="이 문제가 계속 발생하면 페이지를 새로고침하거나 관리자에게 문의하세요."
      ___onRetry={resetError}
      onHome={() => window.location.href = '/'}
      actions={[
        {
          label: '페이지 새로고침',
          onClick: () => window.location.reload(),
          variant: 'primary'
        },
        {
          label: '오류 신고',
          onClick: () => {
            const mailto = `mailto:support@example.com?subject=프론트엔드 오류 신고&body=오류 메시지: ${error.message}%0A%0A스택 트레이스:%0A${error.stack}`
            window.open(mailto)
          },
          variant: 'secondary'
        }
      ]}
    />
  )
}