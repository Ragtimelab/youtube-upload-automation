import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { WebSocketMessage, WebSocketConnectionStatus } from '@/types/api'

/**
 * React 19 최적화된 전역 WebSocket 상태 관리
 * Props drilling 완전 제거, Context 분할로 리렌더링 최소화
 */

interface WebSocketContextValue {
  // 연결 상태
  isConnected: boolean
  connectionStatus: WebSocketConnectionStatus
  lastMessage: WebSocketMessage | null
  error: string | null
  reconnectAttempts: number
  
  // 액션 함수들 - useCallback으로 안정화
  connect: () => void
  disconnect: () => void
  sendMessage: (message: unknown) => boolean
  requestStatus: () => boolean
  
  // 이벤트 핸들러 등록
  onMessage: (messageType: string, handler: (data: unknown) => void) => () => void
  onConnectionChange: (handler: (isConnected: boolean, status: WebSocketConnectionStatus) => void) => () => void
}

interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
  clientId?: string
  autoConnect?: boolean
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

/**
 * 전역 WebSocket Provider
 * 모든 컴포넌트에서 WebSocket 상태에 접근 가능
 */
export function WebSocketProvider({
  children,
  url = 'ws://localhost:8000/ws/',
  clientId,
  autoConnect = true
}: WebSocketProviderProps) {
  // WebSocket 훅 사용
  const webSocket = useWebSocket({
    url,
    clientId: clientId || `app-${Date.now()}`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    enableHeartbeat: true,
    heartbeatInterval: 30000
  }, autoConnect)

  // Context 값을 useMemo로 최적화
  const contextValue = useMemo<WebSocketContextValue>(() => ({
    // 상태
    isConnected: webSocket.isConnected,
    connectionStatus: webSocket.connectionStatus,
    lastMessage: webSocket.lastMessage,
    error: webSocket.error,
    reconnectAttempts: webSocket.reconnectAttempts,
    
    // 액션들 - 이미 useCallback으로 최적화됨
    connect: webSocket.connect,
    disconnect: webSocket.disconnect,
    sendMessage: webSocket.sendMessage,
    requestStatus: webSocket.requestStatus,
    onMessage: webSocket.onMessage,
    onConnectionChange: webSocket.onConnectionChange
  }), [
    webSocket.isConnected,
    webSocket.connectionStatus,
    webSocket.lastMessage,
    webSocket.error,
    webSocket.reconnectAttempts,
    webSocket.connect,
    webSocket.disconnect,
    webSocket.sendMessage,
    webSocket.requestStatus,
    webSocket.onMessage,
    webSocket.onConnectionChange
  ])

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

/**
 * WebSocket Context 훅
 * Props drilling 없이 어느 컴포넌트에서든 WebSocket 상태 사용 가능
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  
  return context
}

/**
 * 특정 메시지 타입 구독 훅
 * 컴포넌트가 특정 WebSocket 메시지만 구독할 때 사용
 */
export function useWebSocketMessage<T = unknown>(
  messageType: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
) {
  const { onMessage } = useWebSocketContext()
  
  // 핸들러를 useCallback으로 최적화
  const memoizedHandler = useCallback(
    (data: unknown) => handler(data as T),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handler, ...dependencies]
  )
  
  useEffect(() => {
    const unsubscribe = onMessage(messageType, memoizedHandler)
    return unsubscribe
  }, [messageType, memoizedHandler, onMessage])
}

/**
 * WebSocket 연결 상태 전용 훅
 * 연결 상태만 필요한 컴포넌트에서 사용하여 불필요한 리렌더링 방지
 */
export function useWebSocketConnection() {
  const { isConnected, connectionStatus, error, reconnectAttempts, connect, disconnect } = useWebSocketContext()
  
  return useMemo(() => ({
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,
    connect,
    disconnect
  }), [isConnected, connectionStatus, error, reconnectAttempts, connect, disconnect])
}

/**
 * WebSocket 메시지 전송 전용 훅  
 * 메시지 전송 기능만 필요한 컴포넌트에서 사용
 */
export function useWebSocketSender() {
  const { sendMessage, isConnected } = useWebSocketContext()
  
  const send = useCallback((message: unknown) => {
    if (!isConnected) {
      console.warn('WebSocket is not connected. Message not sent:', message)
      return false
    }
    return sendMessage(message)
  }, [sendMessage, isConnected])
  
  return { send, isConnected }
}

/**
 * 실시간 업로드 진행률 구독 훅
 * YouTube 업로드 관련 컴포넌트에서 사용
 */
export function useUploadProgress(scriptId?: number) {
  const [progress, setProgress] = React.useState<{
    script_id: number
    message: string
    progress: number
    status: string
  } | null>(null)
  
  useWebSocketMessage<{
    script_id: number
    message: string  
    progress: number
    status: string
  }>('upload_progress', (data) => {
    // 특정 스크립트 ID만 필터링 (선택적)
    if (scriptId && data.script_id !== scriptId) {
      return
    }
    setProgress(data)
  }, [scriptId])
  
  return progress
}

/**
 * YouTube 상태 변화 구독 훅
 * YouTube 업로드 완료/실패 알림 처리
 */
export function useYouTubeStatus(scriptId?: number) {
  const [status, setStatus] = React.useState<{
    script_id: number
    status: 'completed' | 'error' | 'uploading' | 'pending'
    error_message?: string
    youtube_url?: string
    progress?: number
  } | null>(null)
  
  useWebSocketMessage<{
    script_id: number
    status: 'completed' | 'error' | 'uploading' | 'pending'
    error_message?: string
    youtube_url?: string
    progress?: number
  }>('youtube_status', (data) => {
    // 특정 스크립트 ID만 필터링 (선택적)
    if (scriptId && data.script_id !== scriptId) {
      return
    }
    setStatus(data)
  }, [scriptId])
  
  return status
}