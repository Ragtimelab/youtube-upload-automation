/**
 * 접근성 강화 진행률 표시 컴포넌트
 * WCAG 2.1 AA 준수 - 진행률 알림, 시각적 피드백
 */

import { useId, useState } from 'react'
import { useScreenReader } from '@/hooks/useAccessibility'
import { ScreenReaderOnly } from './ScreenReaderComponents'

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
 * 단계별 진행률 컴포넌트
 */
interface StepProgressProps {
  currentStep: number
  totalSteps: number
  steps: Array<{ id: string; label: string }>
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  steps,
  className = ''
}: StepProgressProps) {
  const { announce } = useScreenReader()
  const progressId = useId()

  // 단계 변경 시 알림
  useState(() => {
    if (currentStep > 0 && currentStep <= totalSteps) {
      const currentStepLabel = steps[currentStep - 1]?.label || `${currentStep}단계`
      announce(`${currentStepLabel} 진행 중입니다. ${totalSteps}단계 중 ${currentStep}단계입니다.`)
    }
  })

  return (
    <div className={className}>
      <div className="flex items-center" role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={totalSteps} aria-describedby={progressId}>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* 단계 원 */}
              <div className="relative">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-600'}
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {stepNumber}
                </div>
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>

              {/* 단계 레이블 */}
              <div className={`ml-3 ${index < steps.length - 1 ? 'mr-4' : ''}`}>
                <div
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-1 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <ScreenReaderOnly>
        <span id={progressId}>
          {totalSteps}단계 중 {currentStep}단계 진행 중입니다.
        </span>
      </ScreenReaderOnly>
    </div>
  )
}