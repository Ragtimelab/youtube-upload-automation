import { useMemo } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import {
  WebSocketContext,
  type WebSocketContextValue,
  type WebSocketProviderProps
} from '@/types/websocket'

/**
 * React 19 최적화된 전역 WebSocket 상태 관리
 * Props drilling 완전 제거, Context 분할로 리렌더링 최소화
 */

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

// WebSocket 관련 훅들은 @/hooks/useWebSocketContext로 분리됨 (React Refresh 호환성)