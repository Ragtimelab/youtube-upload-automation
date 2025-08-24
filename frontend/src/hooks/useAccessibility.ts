import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * WCAG 2.1 AA 기준 접근성 훅 모음
 * 실무 표준 접근성 지원 시스템
 */

/**
 * 키보드 네비게이션 훅
 * Tab, Enter, Space, Escape 키 관리
 */
export function useKeyboardNavigation() {
  const navigate = useNavigate()

  const handleKeyPress = useCallback((event: KeyboardEvent, actions: {
    onEnter?: () => void
    onSpace?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onHome?: () => void
    onEnd?: () => void
  }) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        actions.onEnter?.()
        break
      case ' ':
      case 'Space':
        event.preventDefault()
        actions.onSpace?.()
        break
      case 'Escape':
        event.preventDefault()
        actions.onEscape?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        actions.onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        actions.onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        actions.onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        actions.onArrowRight?.()
        break
      case 'Home':
        event.preventDefault()
        actions.onHome?.()
        break
      case 'End':
        event.preventDefault()
        actions.onEnd?.()
        break
    }
  }, [])

  // 전역 키보드 단축키
  const handleGlobalKeys = useCallback((event: KeyboardEvent) => {
    // Alt + 1: 홈페이지로 이동
    if (event.altKey && event.key === '1') {
      event.preventDefault()
      navigate('/')
      return
    }

    // Alt + 2: 스크립트 관리로 이동
    if (event.altKey && event.key === '2') {
      event.preventDefault()
      navigate('/scripts')
      return
    }

    // Alt + 3: 업로드 페이지로 이동
    if (event.altKey && event.key === '3') {
      event.preventDefault()
      navigate('/upload')
      return
    }

    // Alt + 4: YouTube 관리로 이동
    if (event.altKey && event.key === '4') {
      event.preventDefault()
      navigate('/youtube')
      return
    }

    // Alt + 5: 대시보드로 이동
    if (event.altKey && event.key === '5') {
      event.preventDefault()
      navigate('/dashboard')
      return
    }
  }, [navigate])

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeys)
    return () => {
      document.removeEventListener('keydown', handleGlobalKeys)
    }
  }, [handleGlobalKeys])

  return { handleKeyPress }
}

/**
 * 스크린 리더 지원 훅
 * aria-live, aria-atomic 관리
 */
export function useScreenReader() {
  const [liveMessage, setLiveMessage] = useState<string>('')
  const [liveRegion, setLiveRegion] = useState<'polite' | 'assertive'>('polite')

  // 스크린 리더 알림 함수
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setLiveRegion(priority)
    setLiveMessage(message)
    
    // 메시지를 읽은 후 정리 (중복 방지)
    setTimeout(() => {
      setLiveMessage('')
    }, 1000)
  }, [])

  // 진행률 알림
  const announceProgress = useCallback((current: number, total: number, operation: string) => {
    const percentage = Math.round((current / total) * 100)
    announce(`${operation} 진행률: ${percentage}%. ${current}개 중 ${total}개 완료`, 'polite')
  }, [announce])

  // 상태 변경 알림
  const announceStatusChange = useCallback((status: string, context?: string) => {
    const message = context ? `${context}: ${status}` : status
    announce(message, 'polite')
  }, [announce])

  // 에러 알림 (높은 우선순위)
  const announceError = useCallback((error: string) => {
    announce(`오류 발생: ${error}`, 'assertive')
  }, [announce])

  // 성공 알림
  const announceSuccess = useCallback((message: string) => {
    announce(`완료: ${message}`, 'polite')
  }, [announce])

  return {
    liveMessage,
    liveRegion,
    announce,
    announceProgress,
    announceStatusChange,
    announceError,
    announceSuccess
  }
}

/**
 * 포커스 관리 훅
 * 모달, 드롭다운 등의 포커스 트랩
 */
export function useFocusManagement() {
  const focusableElementsSelector = 
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

  // 포커스 트랩 (모달, 드롭다운용)
  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(focusableElementsSelector)
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // 초기 포커스
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusableElementsSelector])

  // 이전 포커스로 복원
  const restoreFocus = useCallback((previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus()
    }
  }, [])

  // 포커스 가능한 요소 찾기
  const findFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const elements = container.querySelectorAll(focusableElementsSelector)
    return Array.from(elements) as HTMLElement[]
  }, [focusableElementsSelector])

  return {
    trapFocus,
    restoreFocus,
    findFocusableElements
  }
}

/**
 * 터치 인터랙션 훅
 * 모바일/태블릿 접근성
 */
export function useTouchAccessibility() {
  const [touchStartTime, setTouchStartTime] = useState<number>(0)
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null)

  // 터치 시작
  const handleTouchStart = useCallback((event: React.TouchEvent, onLongPress?: () => void) => {
    setTouchStartTime(Date.now())
    const touch = event.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })

    // 긴 터치 감지 (500ms)
    if (onLongPress) {
      setTimeout(() => {
        if (Date.now() - touchStartTime >= 500) {
          onLongPress()
        }
      }, 500)
    }
  }, [touchStartTime])

  // 터치 종료
  const handleTouchEnd = useCallback((event: React.TouchEvent, onClick?: () => void) => {
    const touchDuration = Date.now() - touchStartTime
    const touch = event.changedTouches[0]
    const endPosition = { x: touch.clientX, y: touch.clientY }

    // 짧은 터치이고 위치 변화가 적으면 클릭으로 간주
    if (touchDuration < 500 && touchPosition) {
      const distance = Math.sqrt(
        Math.pow(endPosition.x - touchPosition.x, 2) + 
        Math.pow(endPosition.y - touchPosition.y, 2)
      )
      
      if (distance < 10 && onClick) {
        onClick()
      }
    }

    setTouchStartTime(0)
    setTouchPosition(null)
  }, [touchStartTime, touchPosition])

  return {
    handleTouchStart,
    handleTouchEnd
  }
}

/**
 * 색상 대비 검증 훅
 * WCAG AA 기준 4.5:1 대비율 확인
 */
export function useColorContrast() {
  // RGB 색상을 휘도로 변환
  const getLuminance = useCallback((r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(component => {
      component = component / 255
      return component <= 0.03928 
        ? component / 12.92 
        : Math.pow((component + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }, [])

  // 대비율 계산
  const getContrastRatio = useCallback((color1: string, color2: string): number => {
    // 색상 파싱 (간단한 hex 지원)
    const parseColor = (color: string): [number, number, number] => {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return [r, g, b]
    }

    const [r1, g1, b1] = parseColor(color1)
    const [r2, g2, b2] = parseColor(color2)

    const l1 = getLuminance(r1, g1, b1)
    const l2 = getLuminance(r2, g2, b2)

    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  }, [getLuminance])

  // WCAG AA 기준 확인 (4.5:1)
  const meetsWCAGAA = useCallback((foreground: string, background: string): boolean => {
    return getContrastRatio(foreground, background) >= 4.5
  }, [getContrastRatio])

  // WCAG AAA 기준 확인 (7:1)
  const meetsWCAGAAA = useCallback((foreground: string, background: string): boolean => {
    return getContrastRatio(foreground, background) >= 7
  }, [getContrastRatio])

  return {
    getContrastRatio,
    meetsWCAGAA,
    meetsWCAGAAA
  }
}

/**
 * 접근성 상태 관리 훅
 * 사용자 설정 및 보조 기술 감지
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false
  })

  useEffect(() => {
    // 미디어 쿼리를 통한 사용자 설정 감지
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: motionQuery.matches,
        highContrast: contrastQuery.matches,
        screenReader: !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack|Dragon/i)
      }))
    }

    updatePreferences()

    motionQuery.addEventListener('change', updatePreferences)
    contrastQuery.addEventListener('change', updatePreferences)

    return () => {
      motionQuery.removeEventListener('change', updatePreferences)
      contrastQuery.removeEventListener('change', updatePreferences)
    }
  }, [])

  return preferences
}