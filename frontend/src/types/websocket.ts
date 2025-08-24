import { createContext } from 'react'
import type { WebSocketMessage, WebSocketConnectionStatus } from '@/types/api'

/**
 * WebSocket 관련 타입 정의
 */

export interface WebSocketContextValue {
  // 연결 상태
  isConnected: boolean
  connectionStatus: WebSocketConnectionStatus
  lastMessage: WebSocketMessage | null
  error: string | null
  reconnectAttempts: number
  
  // 액션 함수들 - useCallback으로 안정화
  connect: () => void
  disconnect: () => void
  sendMessage: (_message: unknown) => boolean
  requestStatus: () => boolean
  
  // 이벤트 핸들러 등록
  onMessage: (_type: string, _handler: (_data: unknown) => void) => () => void
  onConnectionChange: (_handler: (_isConnected: boolean, _status: WebSocketConnectionStatus) => void) => () => void
}

export interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
  clientId?: string
  autoConnect?: boolean
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export type { WebSocketConnectionStatus }