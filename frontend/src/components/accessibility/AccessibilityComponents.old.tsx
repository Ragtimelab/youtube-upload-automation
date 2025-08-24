import { forwardRef, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { useScreenReader, useFocusManagement, useKeyboardNavigation } from '@/hooks/useAccessibility'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

/**
 * WCAG 2.1 AA 준수 접근성 컴포넌트 라이브러리
 * 실무 표준 접근성 지원 시스템
 */

/**
 * 스크린 리더 전용 텍스트 컴포넌트
 */
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

/**
 * 라이브 리전 컴포넌트 (상태 변경 알림)
 */
export function LiveRegion() {
  const { liveMessage, liveRegion } = useScreenReader()

  return (
    <div
      aria-live={liveRegion}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {liveMessage}
    </div>
  )
}

/**
 * 접근성 강화 버튼 컴포넌트
 */
interface AccessibleButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
  ariaDescribedBy?: string
  loading?: boolean
  loadingText?: string
  className?: string
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  loadingText = '처리 중...',
  className = '',
  ...props
}, ref) => {
  const { handleKeyPress } = useKeyboardNavigation()
  const { announce } = useScreenReader()

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px] min-w-[32px]',
    md: 'px-4 py-2 text-sm min-h-[44px] min-w-[44px]', // WCAG 터치 영역 기준
    lg: 'px-6 py-3 text-base min-h-[48px] min-w-[48px]'
  }

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
      if (ariaLabel) {
        announce(`${ariaLabel} 버튼이 클릭되었습니다.`)
      }
    }
  }

  const handleKey = (event: React.KeyboardEvent) => {
    handleKeyPress(event.nativeEvent, {
      onEnter: handleClick,
      onSpace: handleClick
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKey}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

AccessibleButton.displayName = 'AccessibleButton'

/**
 * 접근성 강화 모달 컴포넌트
 */
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true
}: AccessibleModalProps) {
  const titleId = useId()
  const { trapFocus, restoreFocus } = useFocusManagement()
  const { handleKeyPress } = useKeyboardNavigation()
  const { announce } = useScreenReader()
  const [previousActiveElement] = useState<HTMLElement | null>(
    () => document.activeElement as HTMLElement
  )

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
    announce('모달이 닫혔습니다.')
    restoreFocus(previousActiveElement)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const keyHandlers = closeOnEscape ? { onEscape: handleClose } : {}
    handleKeyPress(event.nativeEvent, keyHandlers)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden focus:outline-none`}
        ref={(element) => {
          if (element && isOpen) {
            trapFocus({ current: element })
            announce(`모달 열림: ${title}`)
          }
        }}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={handleClose}
            ariaLabel={`${title} 모달 닫기`}
            className="p-2 -mr-2"
          >
            <X className="w-5 h-5" />
          </AccessibleButton>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * 접근성 강화 알림 컴포넌트
 */
interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function AccessibleAlert({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className = ''
}: AccessibleAlertProps) {
  const { announce } = useScreenReader()
  const titleId = useId()
  const messageId = useId()

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle
  }

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  const iconStyles = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  }

  const roles = {
    info: 'status',
    success: 'status',
    warning: 'alert',
    error: 'alert'
  } as const

  const Icon = icons[type]

  // 알림 표시 시 스크린 리더에 알림
  useState(() => {
    announce(`${type === 'error' ? '오류' : type === 'warning' ? '경고' : type === 'success' ? '성공' : '정보'}: ${title}. ${message}`, 
             type === 'error' || type === 'warning' ? 'assertive' : 'polite')
  })

  return (
    <div
      className={`p-4 border rounded-lg ${styles[type]} ${className}`}
      role={roles[type]}
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div className="flex">
        <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${iconStyles[type]}`} aria-hidden="true" />
        <div className="ml-3 flex-1">
          <h3 id={titleId} className="text-sm font-medium">
            {title}
          </h3>
          <div id={messageId} className="mt-1 text-sm">
            {message}
          </div>
          {dismissible && onDismiss && (
            <div className="mt-3">
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                ariaLabel={`${title} 알림 닫기`}
                className="text-current hover:bg-current hover:bg-opacity-10 -ml-1"
              >
                닫기
              </AccessibleButton>
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            ariaLabel={`${title} 알림 닫기`}
            className="text-current hover:bg-current hover:bg-opacity-10 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </AccessibleButton>
        )}
      </div>
    </div>
  )
}

/**
 * 진행률 표시 접근성 컴포넌트
 */
interface AccessibleProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  className = ''
}: AccessibleProgressProps) {
  const { announceProgress } = useScreenReader()
  const percentage = Math.round((value / max) * 100)
  const progressId = useId()
  const labelId = useId()

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  // 진행률 변경 시 알림 (10% 단위로)
  useState(() => {
    if (percentage % 10 === 0 && label) {
      announceProgress(value, max, label)
    }
  })

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label id={labelId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-gray-500" aria-live="polite">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={progressId}
      >
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ScreenReaderOnly>
        <span id={progressId}>{label && `${label}: `}{percentage}% 완료</span>
      </ScreenReaderOnly>
    </div>
  )
}

/**
 * 건너뛰기 링크 컴포넌트
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      메인 콘텐츠로 건너뛰기
    </a>
  )
}