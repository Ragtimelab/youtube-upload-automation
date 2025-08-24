import React from 'react'
import { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary'

/**
 * HOC: 컴포넌트를 ErrorBoundary로 감싸는 유틸리티
 * React Refresh 호환성을 위해 별도 파일로 분리
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}