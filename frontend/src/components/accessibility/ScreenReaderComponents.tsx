/**
 * 스크린 리더 전용 컴포넌트들
 * WCAG 2.1 AA 준수 - 시각 장애인 지원
 */

import type { ReactNode } from 'react'
import { useScreenReader } from '@/hooks/useAccessibility'

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

/**
 * 페이지 제목 알림 컴포넌트
 */
export function PageAnnouncement({ title }: { title: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {title} 페이지가 로드되었습니다.
    </div>
  )
}