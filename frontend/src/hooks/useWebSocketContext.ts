import React, { useContext, useCallback, useEffect, useRef, useMemo } from 'react'
import { WebSocketContext, type WebSocketConnectionStatus } from '@/types/websocket'

/**
 * WebSocket Context 훅
 * Props drilling 없이 어느 컴포넌트에서든 WebSocket 상태 사용 가능
 * React Refresh 호환성을 위해 별도 파일로 분리
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
  handler: (_data: T) => void,
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
    return onMessage(messageType, memoizedHandler)
  }, [messageType, memoizedHandler, onMessage])
}

/**
 * WebSocket 연결 상태 변화 구독 훅
 * 연결 상태 변화를 감지하고 콜백 실행
 */
export function useWebSocketConnectionStatus(
  handler: (_isConnected: boolean, _status: WebSocketConnectionStatus) => void,
  dependencies: React.DependencyList = []
) {
  const { onConnectionChange, connectionStatus } = useWebSocketContext()
  
  const memoizedHandler = useCallback(
    handler,
    [handler, ...dependencies]
  )

  useEffect(() => {
    return onConnectionChange(memoizedHandler)
  }, [memoizedHandler, onConnectionChange])
  
  return connectionStatus
}

/**
 * WebSocket 자동 재연결 훅
 * 연결이 끊어지면 지정된 간격으로 재연결 시도
 */
export function useWebSocketAutoReconnect(
  enabled = true,
  interval = 5000,
  maxRetries = 10
) {
  const { isConnected, connectionStatus, connect } = useWebSocketContext()
  const retryCountRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startReconnect = useCallback(() => {
    if (!enabled || retryCountRef.current >= maxRetries) return
    
    timeoutRef.current = setTimeout(() => {
      retryCountRef.current++
      connect()
    }, interval)
  }, [enabled, maxRetries, interval, connect])

  useEffect(() => {
    if (!enabled) return

    if (isConnected) {
      // 연결 성공 시 재시도 횟수 초기화
      retryCountRef.current = 0
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      // 연결 실패 시 재연결 시도
      startReconnect()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isConnected, connectionStatus, enabled, startReconnect])

  return {
    retryCount: retryCountRef.current,
    maxRetries,
    canRetry: retryCountRef.current < maxRetries
  }
}

/**
 * WebSocket 메시지 전송 훅
 * 메시지 전송 상태와 큐 관리 기능 제공
 */
export function useWebSocketSender() {
  const { sendMessage, isConnected } = useWebSocketContext()
  const messageQueueRef = useRef<unknown[]>([])

  const sendWithQueue = useCallback((message: unknown) => {
    if (isConnected) {
      return sendMessage(message)
    } else {
      // 연결되지 않은 경우 큐에 저장
      messageQueueRef.current.push(message)
      return false
    }
  }, [sendMessage, isConnected])

  const flushQueue = useCallback(() => {
    if (!isConnected) return false

    const queue = [...messageQueueRef.current]
    messageQueueRef.current = []
    
    let success = true
    for (const message of queue) {
      if (!sendMessage(message)) {
        success = false
        break
      }
    }
    
    return success
  }, [sendMessage, isConnected])

  // 연결 시 큐에 있는 메시지들 자동 전송
  useEffect(() => {
    if (isConnected && messageQueueRef.current.length > 0) {
      flushQueue()
    }
  }, [isConnected, flushQueue])

  return {
    send: sendWithQueue,
    flushQueue,
    queueSize: messageQueueRef.current.length,
    isConnected
  }
}

/**
 * WebSocket 상태 정보 종합 훅
 * 연결 상태, 메트릭, 진단 정보 제공
 */
export function useWebSocketStatus() {
  const { isConnected, connectionStatus } = useWebSocketContext()
  const [lastMessageTime, setLastMessageTime] = React.useState<Date | null>(null)
  const [messageCount, setMessageCount] = React.useState(0)

  // 메시지 수신 시간 추적
  useWebSocketMessage('*', () => {
    setLastMessageTime(new Date())
    setMessageCount(prev => prev + 1)
  })

  return useMemo(() => ({
    isConnected,
    connectionStatus,
    lastMessageTime,
    messageCount,
    isHealthy: isConnected && connectionStatus === 'connected'
  }), [isConnected, connectionStatus, lastMessageTime, messageCount])
}