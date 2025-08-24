/**
 * Jest 테스트 설정 파일
 * Phase 7: 테스트 전략 및 품질 보증
 */

import '@testing-library/jest-dom'

// React 19 Concurrent Features 모킹
Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  value: jest.fn().mockImplementation((cb: Function) => {
    return setTimeout(() => cb({ timeRemaining: () => 50 }), 0)
  }),
})

Object.defineProperty(window, 'cancelIdleCallback', {
  writable: true,
  value: jest.fn().mockImplementation((id: number) => clearTimeout(id)),
})

// IntersectionObserver 모킹 (Lazy Loading 컴포넌트용)
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// ResizeObserver 모킹 (반응형 컴포넌트용)
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// matchMedia 모킹 (반응형 훅용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// 접근성 관련 모킹
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
  },
})

// WebSocket 모킹 (실시간 통신용)
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  
  public readyState = MockWebSocket.CONNECTING
  public url: string
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    // 연결 시뮬레이션
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }

  send = jest.fn()
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED
  })
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
}

// @ts-ignore
global.WebSocket = MockWebSocket

// File API 모킹 (파일 업로드 테스트용)
Object.defineProperty(global, 'File', {
  value: class MockFile {
    public name: string
    public size: number
    public type: string
    public lastModified: number

    constructor(parts: BlobPart[], filename: string, properties?: FilePropertyBag) {
      this.name = filename
      this.type = properties?.type || ''
      this.lastModified = properties?.lastModified || Date.now()
      
      // 크기 계산 (타입 안전성 보장)
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + part.length
        } else if (part instanceof ArrayBuffer) {
          return acc + part.byteLength
        } else if (part instanceof Uint8Array) {
          return acc + part.length
        }
        return acc
      }, 0)
    }

    arrayBuffer = jest.fn(() => Promise.resolve(new ArrayBuffer(this.size)))
    text = jest.fn(() => Promise.resolve(''))
    stream = jest.fn()
    slice = jest.fn()
  }
})

// Clipboard API 모킹
;(Object as any).defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(void 0),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// 전역 테스트 유틸리티
(global as any).TestUtils = {
  // 비동기 대기 헬퍼
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 모의 스크립트 데이터
  createMockScript: (overrides = {}) => ({
    id: 'script-1',
    title: '테스트 스크립트',
    description: '테스트용 스크립트 설명',
    content: '테스트 스크립트 내용',
    tags: ['테스트', '샘플'],
    status: 'script_ready' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),
  
  // 모의 YouTube 데이터
  createMockYouTubeVideo: (overrides = {}) => ({
    id: 'video-1',
    title: '테스트 비디오',
    description: '테스트용 비디오 설명',
    tags: ['테스트'],
    status: 'uploaded' as const,
    youtube_id: 'test-youtube-id',
    upload_progress: 100,
    created_at: new Date().toISOString(),
    ...overrides
  }),
}

// 콘솔 경고 억제 (테스트 중 불필요한 로그 제거)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})