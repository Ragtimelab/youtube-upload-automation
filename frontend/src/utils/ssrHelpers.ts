/**
 * Phase 11: SSR Compatibility Helpers
 * Server-Side Rendering 호환성을 위한 유틸리티
 * 
 * Next.js App Router 및 Server Components와의 호환성 보장:
 * - 클라이언트/서버 환경 감지
 * - SSR 안전한 상태 관리
 * - Hydration 불일치 방지
 * - Progressive Enhancement
 */

/**
 * 환경 감지 유틸리티
 */
export const Environment = {
  /**
   * 클라이언트 환경인지 확인
   */
  isClient(): boolean {
    return typeof window !== 'undefined'
  },

  /**
   * 서버 환경인지 확인
   */
  isServer(): boolean {
    return typeof window === 'undefined'
  },

  /**
   * 개발 환경인지 확인
   */
  isDevelopment(): boolean {
    return import.meta.env.MODE === 'development'
  },

  /**
   * 프로덕션 환경인지 확인
   */
  isProduction(): boolean {
    return import.meta.env.MODE === 'production'
  },

  /**
   * Next.js 환경인지 확인
   */
  isNextJS(): boolean {
    return typeof window !== 'undefined' && '__NEXT_DATA__' in window
  }
}

/**
 * SSR 안전한 localStorage 접근
 */
export const SafeStorage = {
  /**
   * localStorage에서 값 읽기 (SSR 안전)
   */
  getItem(key: string, defaultValue: string = ''): string {
    if (Environment.isServer()) {
      return defaultValue
    }

    try {
      const value = localStorage.getItem(key)
      return value !== null ? value : defaultValue
    } catch (error) {
      console.warn(`localStorage.getItem failed for key "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * localStorage에 값 저장 (SSR 안전)
   */
  setItem(key: string, value: string): boolean {
    if (Environment.isServer()) {
      return false
    }

    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn(`localStorage.setItem failed for key "${key}":`, error)
      return false
    }
  },

  /**
   * localStorage에서 값 제거 (SSR 안전)
   */
  removeItem(key: string): boolean {
    if (Environment.isServer()) {
      return false
    }

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, error)
      return false
    }
  },

  /**
   * JSON 객체를 안전하게 저장/읽기
   */
  getJSON<T>(key: string, defaultValue: T): T {
    const jsonString = this.getItem(key, '')
    if (!jsonString) return defaultValue

    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn(`JSON.parse failed for key "${key}":`, error)
      return defaultValue
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      const jsonString = JSON.stringify(value)
      return this.setItem(key, jsonString)
    } catch (error) {
      console.warn(`JSON.stringify failed for key "${key}":`, error)
      return false
    }
  }
}

/**
 * SSR 안전한 브라우저 API 접근
 */
export const SafeBrowser = {
  /**
   * 현재 URL 가져오기 (SSR 안전)
   */
  getCurrentURL(): string {
    if (Environment.isServer()) {
      return ''
    }
    return window.location.href
  },

  /**
   * User Agent 가져오기 (SSR 안전)
   */
  getUserAgent(): string {
    if (Environment.isServer()) {
      return ''
    }
    return navigator.userAgent
  },

  /**
   * 뷰포트 크기 가져오기 (SSR 안전)
   */
  getViewportSize(): { width: number; height: number } {
    if (Environment.isServer()) {
      return { width: 1920, height: 1080 } // 기본값
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  },

  /**
   * 페이지 스크롤 위치 가져오기 (SSR 안전)
   */
  getScrollPosition(): { x: number; y: number } {
    if (Environment.isServer()) {
      return { x: 0, y: 0 }
    }

    return {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    }
  }
}

/**
 * Hydration 불일치 방지를 위한 상태 관리
 */
export class HydrationSafeState {
  private static hydrated = false

  /**
   * Hydration 완료 여부 확인
   */
  static isHydrated(): boolean {
    return this.hydrated
  }

  /**
   * Hydration 완료 마킹
   */
  static markAsHydrated(): void {
    this.hydrated = true
  }

  /**
   * SSR과 클라이언트에서 다를 수 있는 값을 안전하게 처리
   */
  static useSafeValue<T>(
    serverValue: T,
    clientValue: T,
    useClientValue: boolean = true
  ): T {
    if (Environment.isServer()) {
      return serverValue
    }

    if (!this.hydrated && useClientValue) {
      // Hydration 전에는 서버 값 사용하여 불일치 방지
      return serverValue
    }

    return clientValue
  }
}

/**
 * Progressive Enhancement를 위한 유틸리티
 */
export const ProgressiveEnhancement = {
  /**
   * 기본 HTML/CSS로 동작하고 JS로 향상되는 컴포넌트 패턴
   */
  enhanceElement(
    element: HTMLElement | null,
    enhancer: (_el: HTMLElement) => void
  ): void {
    if (!element || Environment.isServer()) {
      return
    }

    // DOM이 준비되면 향상 기능 적용
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => enhancer(element))
    } else {
      enhancer(element)
    }
  },

  /**
   * 폼의 기본 동작을 유지하면서 JS로 향상
   */
  enhanceForm(
    form: HTMLFormElement | null,
    onSubmit: (_formData: FormData) => Promise<void>
  ): void {
    if (!form || Environment.isServer()) {
      return
    }

    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault()
      
      const formData = new FormData(form)
      
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Enhanced form submission failed:', error)
        
        // 실패 시 기본 폼 제출로 폴백
        form.submit()
      }
    })
  }
}

/**
 * 성능 최적화를 위한 SSR 유틸리티
 */
export const SSROptimization = {
  /**
   * 크리티컬 CSS 인라인 처리
   */
  inlineCriticalCSS(css: string): string {
    if (Environment.isServer()) {
      return `<style>${css}</style>`
    }
    return ''
  },

  /**
   * 리소스 프리로딩
   */
  preloadResource(href: string, as: string = 'script'): void {
    if (Environment.isServer()) {
      return
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  },

  /**
   * 이미지 지연 로딩 (SSR 호환)
   */
  createLazyImage(src: string, alt: string = ''): string {
    return `
      <img 
        data-src="${src}" 
        alt="${alt}"
        loading="lazy"
        style="opacity: 0; transition: opacity 0.3s;"
        onload="this.style.opacity = 1;"
      />
    `
  },

  /**
   * 컴포넌트의 하이드레이션 우선순위 설정
   */
  setPriority(element: HTMLElement, priority: 'high' | 'normal' | 'low'): void {
    if (Environment.isServer()) {
      return
    }

    element.setAttribute('data-hydrate-priority', priority)
  }
}

/**
 * Server Components와 Client Components 간 데이터 전달
 */
export const DataTransfer = {
  /**
   * 서버에서 클라이언트로 데이터 전달 (Next.js 스타일)
   */
  embedServerData<T>(key: string, data: T): string {
    if (Environment.isServer()) {
      const json = JSON.stringify(data)
      return `
        <script type="application/json" data-server-data="${key}">
          ${json}
        </script>
      `
    }
    return ''
  },

  /**
   * 클라이언트에서 서버 데이터 추출
   */
  extractServerData<T>(key: string): T | null {
    if (Environment.isServer()) {
      return null
    }

    try {
      const script = document.querySelector(`script[data-server-data="${key}"]`)
      if (!script || !script.textContent) {
        return null
      }

      return JSON.parse(script.textContent)
    } catch (error) {
      console.warn(`Failed to extract server data for key "${key}":`, error)
      return null
    }
  },

  /**
   * 스트리밍 중인 데이터 점진적 로딩
   */
  streamData<T>(
    key: string,
    onData: (_data: T) => void,
    onComplete?: () => void
  ): () => void {
    if (Environment.isServer()) {
      return () => {}
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const script = element.querySelector(`script[data-stream-data="${key}"]`)
            
            if (script && script.textContent) {
              try {
                const data = JSON.parse(script.textContent)
                onData(data)
                
                // 스크립트 제거 (메모리 누수 방지)
                script.remove()
              } catch (error) {
                console.warn(`Failed to parse streaming data:`, error)
              }
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 정리 함수 반환
    return () => {
      observer.disconnect()
      if (onComplete) {
        onComplete()
      }
    }
  }
}

/**
 * 메타데이터 관리 (Next.js 호환)
 */
export const MetadataManager = {
  /**
   * 페이지 제목 설정 (SSR 안전)
   */
  setTitle(title: string): void {
    if (Environment.isServer()) {
      return
    }
    document.title = title
  },

  /**
   * 메타 태그 추가/업데이트 (SSR 안전)
   */
  setMeta(name: string, content: string): void {
    if (Environment.isServer()) {
      return
    }

    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    meta.content = content
  },

  /**
   * Open Graph 메타데이터 설정
   */
  setOpenGraph(property: string, content: string): void {
    if (Environment.isServer()) {
      return
    }

    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('property', property)
      document.head.appendChild(meta)
    }
    meta.content = content
  }
}

/**
 * 에러 경계와 SSR 호환성
 */
export const ErrorHandling = {
  /**
   * SSR 안전한 에러 로깅
   */
  logError(error: Error, context: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      url: SafeBrowser.getCurrentURL(),
      userAgent: SafeBrowser.getUserAgent(),
      timestamp: new Date().toISOString(),
      isServer: Environment.isServer()
    }

    if (Environment.isDevelopment()) {
      console.error('SSR Error:', errorInfo)
    }

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (Environment.isProduction() && Environment.isClient()) {
      // 예: Sentry, LogRocket 등으로 전송
      this.sendErrorReport(errorInfo)
    }
  },

  /**
   * 에러 리포트 전송 (클라이언트만)
   */
  sendErrorReport(errorInfo: unknown): void {
    if (Environment.isServer()) {
      return
    }

    // 실제 구현에서는 에러 리포팅 서비스 사용
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo)
    }).catch(err => {
      console.warn('Failed to send error report:', err)
    })
  },

  /**
   * Hydration 에러 감지 및 처리
   */
  detectHydrationErrors(): void {
    if (Environment.isServer()) {
      return
    }

    window.addEventListener('error', (event) => {
      if (event.message.includes('Hydration') || event.message.includes('hydration')) {
        this.logError(new Error(event.message), 'Hydration Error')
      }
    })
  }
}

/**
 * 초기화 함수 - 앱 시작 시 호출
 */
export function initializeSSRHelpers(): void {
  if (Environment.isServer()) {
    return
  }

  // Hydration 완료 표시
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      HydrationSafeState.markAsHydrated()
    })
  } else {
    HydrationSafeState.markAsHydrated()
  }

  // 에러 감지 초기화
  ErrorHandling.detectHydrationErrors()

  // 개발 모드에서 디버깅 도구 활성화
  if (Environment.isDevelopment()) {
    (window as unknown as Window & { __SSR_HELPERS__: unknown }).__SSR_HELPERS__ = {
      Environment,
      SafeStorage,
      SafeBrowser,
      HydrationSafeState,
      DataTransfer,
      MetadataManager
    }
    console.log('🔧 SSR Helpers Debug Mode 활성화됨')
  }
}

// 자동 초기화 (클라이언트에서만)
if (Environment.isClient()) {
  initializeSSRHelpers()
}