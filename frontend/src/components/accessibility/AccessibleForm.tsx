/**
 * 접근성 강화 폼 컴포넌트들
 * WCAG 2.1 AA 준수 - 폼 접근성, 에러 처리
 */

import { forwardRef, useId } from 'react'
import { useScreenReader } from '@/hooks/useAccessibility'
import { ScreenReaderOnly } from './ScreenReaderComponents'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface AccessibleInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  required?: boolean
  disabled?: boolean
  placeholder?: string
  error?: string
  success?: string
  description?: string
  className?: string
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  error,
  success,
  description,
  className = ''
}, ref) => {
  const inputId = useId()
  const errorId = useId()
  const descriptionId = useId()
  const { announce } = useScreenReader()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    
    // 에러 상태 변경 시 알림
    if (error && !e.target.value) {
      announce(`${label} 입력 필드에서 오류가 발생했습니다: ${error}`)
    }
  }

  const inputClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
    ${error ? 'border-red-500 focus:ring-red-500' : 
      success ? 'border-green-500 focus:ring-green-500' : 
      'border-gray-300 focus:ring-blue-500'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <ScreenReaderOnly>필수 항목</ScreenReaderOnly>
          </>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <input
        ref={ref}
        id={inputId}
        type={type}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClasses}
        aria-describedby={`${description ? descriptionId : ''} ${error ? errorId : ''}`}
        aria-invalid={!!error}
        aria-required={required}
      />
      
      {error && (
        <div id={errorId} className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600" role="status">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  )
})

AccessibleInput.displayName = 'AccessibleInput'

interface AccessibleSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
  disabled?: boolean
  error?: string
  description?: string
  className?: string
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  description,
  className = ''
}, ref) => {
  const selectId = useId()
  const errorId = useId()
  const descriptionId = useId()

  const selectClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <ScreenReaderOnly>필수 항목</ScreenReaderOnly>
          </>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      <select
        ref={ref}
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={selectClasses}
        aria-describedby={`${description ? descriptionId : ''} ${error ? errorId : ''}`}
        aria-invalid={!!error}
        aria-required={required}
      >
        <option value="">선택해주세요</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div id={errorId} className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
})

AccessibleSelect.displayName = 'AccessibleSelect'