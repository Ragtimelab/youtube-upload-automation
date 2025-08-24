/**
 * 표준화된 로딩 컴포넌트들
 * 일관된 로딩 상태 표시를 위한 재사용 가능한 컴포넌트들
 */

import { Loader2, RefreshCw } from 'lucide-react'
import { commonLayouts, cn } from '@/utils/classNames'

// 로딩 컴포넌트 기본 Props 타입
interface BaseLoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
}

// 스피너 로딩 컴포넌트
interface SpinnerProps extends BaseLoadingProps {
  variant?: 'default' | 'primary' | 'secondary'
}

export function Spinner({ 
  className, 
  size = 'md', 
  variant = 'default',
  message 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const variantClasses = {
    default: 'text-gray-400',
    primary: 'text-blue-600',
    secondary: 'text-gray-600'
  }

  return (
    <div className={cn(commonLayouts.flexColCenter, className)}>
      <Loader2 className={cn(
        sizeClasses[size], 
        variantClasses[variant],
        'animate-spin'
      )} />
      {message && (
        <p className={`text-${size === 'sm' ? 'xs' : 'sm'} text-gray-600 mt-2`}>
          {message}
        </p>
      )}
    </div>
  )
}

// 전체 화면 로딩 컴포넌트
interface FullScreenLoadingProps extends BaseLoadingProps {
  title?: string
}

export function FullScreenLoading({ 
  message = '로딩 중...', 
  title,
  className 
}: FullScreenLoadingProps) {
  return (
    <div className={cn(
      'flex items-center justify-center min-h-screen bg-gray-50',
      className
    )}>
      <div className="text-center">
        <Spinner size="xl" message={message} />
        {title && (
          <h2 className="mt-4 text-lg font-medium text-gray-900">{title}</h2>
        )}
      </div>
    </div>
  )
}

// 카드 로딩 컴포넌트
interface CardLoadingProps extends BaseLoadingProps {
  rows?: number
  showAvatar?: boolean
}

export function CardLoading({ 
  className, 
  message,
  rows = 3,
  showAvatar = false 
}: CardLoadingProps) {
  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 shadow-sm p-6',
      className
    )}>
      <div className="animate-pulse">
        <div className={commonLayouts.flexStart}>
          {showAvatar && (
            <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div 
              key={i} 
              className={`h-3 bg-gray-200 rounded ${
                i === rows - 1 ? 'w-2/3' : 'w-full'
              }`}
            />
          ))}
        </div>
      </div>
      
      {message && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}
    </div>
  )
}

// 테이블 로딩 컴포넌트
interface TableLoadingProps extends BaseLoadingProps {
  rows?: number
  columns?: number
}

export function TableLoading({ 
  className,
  rows = 5,
  columns = 4,
  message
}: TableLoadingProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      <div className="animate-pulse">
        {/* 테이블 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* 테이블 행들 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-100 px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-4 bg-gray-200 rounded ${
                    colIndex === 0 ? 'w-full' : Math.random() > 0.5 ? 'w-3/4' : 'w-1/2'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {message && (
        <div className="p-6 text-center border-t">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}
    </div>
  )
}

// 버튼 로딩 상태
interface ButtonLoadingProps {
  children: React.ReactNode
  loading?: boolean
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingButton({ 
  children, 
  loading = false,
  className,
  onClick,
  disabled,
  variant = 'default',
  size = 'md'
}: ButtonLoadingProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors'
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }
  
  const variantClasses = {
    default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700'
  }

  return (
    <button
      type="button"
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        (loading || disabled) && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading && (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  )
}

// 섹션 로딩 컴포넌트
interface SectionLoadingProps extends BaseLoadingProps {
  height?: string
  title?: string
}

export function SectionLoading({ 
  className,
  height = '200px',
  message = '데이터를 불러오는 중...',
  title
}: SectionLoadingProps) {
  return (
    <div 
      className={cn(commonLayouts.card, className)} 
      style={{ minHeight: height }}
    >
      <div className={cn(commonLayouts.flexColCenter, 'h-full p-8')}>
        {title && (
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        )}
        <Spinner size="lg" message={message} />
      </div>
    </div>
  )
}

// 리스트 로딩 컴포넌트
interface ListLoadingProps extends BaseLoadingProps {
  items?: number
  showIcon?: boolean
}

export function ListLoading({ 
  className,
  items = 5,
  showIcon = true,
  message
}: ListLoadingProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4 p-4 bg-white rounded-lg border">
          {showIcon && (
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
      {message && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      )}
    </div>
  )
}