import { useState, useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage, WebSocketConnectionStatus, WebSocketState } from '@/types/api'
import { UI_CONSTANTS } from '@/constants/ui'

interface WebSocketConfig {
  url: string
  clientId?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

interface ExtendedWebSocketState extends WebSocketState {
  lastMessage: WebSocketMessage | null
}

export function useWebSocket(config: WebSocketConfig, shouldConnect: boolean = true) {
  const [state, setState] = useState<ExtendedWebSocketState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    error: null,
    reconnectAttempts: 0,
  })

  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null)
  // eslint-disable-next-line unused-imports/no-unused-vars
  const messageHandlers = useRef<Map<string, (data: unknown) => void>>(new Map())
  // eslint-disable-next-line unused-imports/no-unused-vars
  const connectionChangeHandlers = useRef<((isConnected: boolean, status: WebSocketConnectionStatus) => void)[]>([])

  const {
    url,
    clientId,
    enableHeartbeat = true,
    heartbeatInterval = UI_CONSTANTS.INTERVALS.HEARTBEAT
  } = config

  // WebSocket URL 생성 - 안정적인 memoization
  const buildWebSocketUrl = useCallback(() => {
    const wsUrl = new URL(url)
    if (clientId) {
      wsUrl.searchParams.set('client_id', clientId)
    }
    return wsUrl.toString()
  }, [url, clientId])

  // 하트비트 관리
  const startHeartbeat = useCallback(() => {
    if (enableHeartbeat && ws.current?.readyState === WebSocket.OPEN) {
      heartbeatTimer.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            action: 'heartbeat',
            timestamp: new Date().toISOString()
          }))
        }
      }, heartbeatInterval)
    }
  }, [enableHeartbeat, heartbeatInterval])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }
  }, [])

  // 연결 함수
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    if (ws.current) {
      ws.current.close()
      ws.current = null
    }

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }))

    try {
      const wsUrl = buildWebSocketUrl()
      console.log('Connecting to WebSocket:', wsUrl)
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
          error: null,
          reconnectAttempts: 0,
        }))
        
        connectionChangeHandlers.current.forEach(handler => {
          handler(true, 'connected')
        })
        
        if (ws.current?.readyState === WebSocket.OPEN) {
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
          
          setState(prev => ({ ...prev, lastMessage: message }))
          
          const handler = messageHandlers.current.get(message.type)
          if (handler) {
            handler(message.data)
          }
          
          const allHandler = messageHandlers.current.get('*')
          if (allHandler) {
            allHandler(message)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.current.onclose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected'
        }))
        
        connectionChangeHandlers.current.forEach(handler => {
          handler(false, 'disconnected')
        })
        
        stopHeartbeat()
      }

      ws.current.onerror = () => {
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
  }, [buildWebSocketUrl, startHeartbeat, stopHeartbeat])

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    
    stopHeartbeat()
    
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect')
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
  const sendMessage = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // 메시지 핸들러 등록
  // eslint-disable-next-line unused-imports/no-unused-vars
  const onMessage = useCallback((messageType: string, handler: (data: unknown) => void) => {
    messageHandlers.current.set(messageType, handler)
    
    return () => {
      messageHandlers.current.delete(messageType)
    }
  }, [])

  // 연결 상태 변화 핸들러 등록
  // eslint-disable-next-line unused-imports/no-unused-vars
  const onConnectionChange = useCallback((handler: (isConnected: boolean, status: WebSocketConnectionStatus) => void) => {
    connectionChangeHandlers.current.push(handler)
    
    return () => {
      const index = connectionChangeHandlers.current.indexOf(handler)
      if (index > -1) {
        connectionChangeHandlers.current.splice(index, 1)
      }
    }
  }, [])

  // 상태 정보 요청
  const requestStatus = useCallback(() => {
    return sendMessage({
      action: 'get_status'
    })
  }, [sendMessage])

  // 초기 연결
  useEffect(() => {
    if (shouldConnect) {
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldConnect])

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    onConnectionChange,
    requestStatus,
  }
}