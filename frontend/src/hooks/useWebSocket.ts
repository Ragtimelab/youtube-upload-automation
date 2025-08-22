import { useState, useEffect, useRef, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface WebSocketConfig {
  url: string
  clientId?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

interface WebSocketState {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastMessage: WebSocketMessage | null
  error: string | null
  reconnectAttempts: number
}

export function useWebSocket(config: WebSocketConfig) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    error: null,
    reconnectAttempts: 0,
  })

  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null)
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map())

  const {
    url,
    clientId,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    enableHeartbeat = true,
    heartbeatInterval = 30000
  } = config

  // WebSocket URL 생성
  const buildWebSocketUrl = useCallback(() => {
    const wsUrl = new URL(url)
    if (clientId) {
      wsUrl.searchParams.set('client_id', clientId)
    }
    return wsUrl.toString()
  }, [url, clientId])

  // 하트비트 시작
  const startHeartbeat = useCallback(() => {
    if (enableHeartbeat && ws.current && ws.current.readyState === WebSocket.OPEN) {
      heartbeatTimer.current = setInterval(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            action: 'heartbeat',
            timestamp: new Date().toISOString()
          }))
        }
      }, heartbeatInterval)
    }
  }, [enableHeartbeat, heartbeatInterval])

  // 하트비트 중지
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }
  }, [])

  // 연결 함수
  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }))

    try {
      const wsUrl = buildWebSocketUrl()
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = (event) => {
        console.log('WebSocket connected:', event)
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
          error: null,
          reconnectAttempts: 0,
        }))
        
        // 연결 후 구독 메시지 전송
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            action: 'subscribe',
            message_types: ['upload_progress', 'youtube_status', 'system_notification']
          }))
        }

        startHeartbeat()
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          
          setState(prev => ({ ...prev, lastMessage: message }))
          
          // 메시지 타입별 핸들러 실행
          const handler = messageHandlers.current.get(message.type)
          if (handler) {
            handler(message.data)
          }
          
          // 범용 핸들러 실행
          const allHandler = messageHandlers.current.get('*')
          if (allHandler) {
            allHandler(message)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event)
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected'
        }))
        stopHeartbeat()
        
        // 재연결 시도
        if (state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            reconnectAttempts: prev.reconnectAttempts + 1 
          }))
          
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event)
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          error: 'WebSocket 연결 오류'
        }))
      }

    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [buildWebSocketUrl, state.reconnectAttempts, maxReconnectAttempts, reconnectInterval, startHeartbeat, stopHeartbeat])

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    
    stopHeartbeat()
    
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionStatus: 'disconnected',
      reconnectAttempts: 0
    }))
  }, [stopHeartbeat])

  // 메시지 전송
  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    console.warn('WebSocket is not connected')
    return false
  }, [])

  // 메시지 핸들러 등록
  const onMessage = useCallback((messageType: string, handler: (data: any) => void) => {
    messageHandlers.current.set(messageType, handler)
    
    return () => {
      messageHandlers.current.delete(messageType)
    }
  }, [])

  // 상태 정보 요청
  const requestStatus = useCallback(() => {
    return sendMessage({
      action: 'get_status'
    })
  }, [sendMessage])

  // 컴포넌트 마운트/언마운트 시 처리
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, []) // connect, disconnect는 의존성에서 제외 (무한 루프 방지)

  // 정리 함수
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      stopHeartbeat()
    }
  }, [stopHeartbeat])

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    requestStatus,
  }
}