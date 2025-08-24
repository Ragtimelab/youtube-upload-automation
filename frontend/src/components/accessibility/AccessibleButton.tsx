/**
 * 접근성 강화 버튼 컴포넌트
 * WCAG 2.1 AA 준수 - 키보드 네비게이션, 터치 영역 기준
 */

import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { useScreenReader, useKeyboardNavigation } from '@/hooks/useAccessibility'

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

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <button
      ref={ref}
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKey}
      disabled={disabled || loading}
      aria-label={loading ? loadingText : ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
})

AccessibleButton.displayName = 'AccessibleButton'