/**
 * WebSocket 실시간 통신을 위한 커스텀 훅
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketConfig {
  url: string;
  userId?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId: string | null;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  reconnectAttempts: number;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const messageHandlers = useRef<Map<string, (message: WebSocketMessage) => void>>(new Map());
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionId: null,
    lastMessage: null,
    error: null,
    reconnectAttempts: 0,
  });

  const {
    url,
    userId,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    debug = false
  } = config;

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[useWebSocket] ${message}`, ...args);
    }
  }, [debug]);

  const buildWebSocketUrl = useCallback(() => {
    const wsUrl = new URL(url);
    if (userId) {
      wsUrl.searchParams.set('user_id', userId);
    }
    return wsUrl.toString();
  }, [url, userId]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.CONNECTING || 
        ws.current?.readyState === WebSocket.OPEN) {
      log('WebSocket 이미 연결되어 있거나 연결 중입니다');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));

    try {
      const wsUrl = buildWebSocketUrl();
      log('WebSocket 연결 시도:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        log('WebSocket 연결 성공');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
        }));

        // 재연결 타이머 정리
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          log('메시지 수신:', message);

          setState(prev => ({
            ...prev,
            lastMessage: message,
          }));

          // 연결 확인 메시지 처리
          if (message.type === 'connection_established') {
            setState(prev => ({
              ...prev,
              connectionId: message.connection_id,
            }));
          }

          // 등록된 핸들러 실행
          const handler = messageHandlers.current.get(message.type);
          if (handler) {
            handler(message);
          }

          // 전체 메시지 핸들러 실행
          const globalHandler = messageHandlers.current.get('*');
          if (globalHandler) {
            globalHandler(message);
          }

        } catch (error) {
          log('메시지 파싱 오류:', error);
        }
      };

      ws.current.onclose = (event) => {
        log('WebSocket 연결 종료:', event.code, event.reason);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionId: null,
        }));

        // 정상 종료가 아닌 경우 재연결 시도
        if (event.code !== 1000 && state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));

          reconnectTimer.current = setTimeout(() => {
            log(`재연결 시도 중... (${state.reconnectAttempts + 1}/${maxReconnectAttempts})`);
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        log('WebSocket 오류:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket 연결 오류가 발생했습니다',
          isConnecting: false,
        }));
      };

    } catch (error) {
      log('WebSocket 생성 오류:', error);
      setState(prev => ({
        ...prev,
        error: 'WebSocket 생성에 실패했습니다',
        isConnecting: false,
      }));
    }
  }, [buildWebSocketUrl, log, maxReconnectAttempts, reconnectInterval, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    log('WebSocket 연결 해제');
    
    // 재연결 타이머 정리
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    // WebSocket 연결 종료
    if (ws.current) {
      ws.current.close(1000, 'User initiated disconnect');
      ws.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionId: null,
      reconnectAttempts: 0,
    }));
  }, [log]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        ws.current.send(messageString);
        log('메시지 전송:', message);
      } catch (error) {
        log('메시지 전송 오류:', error);
      }
    } else {
      log('WebSocket이 연결되지 않음. 메시지 전송 실패:', message);
    }
  }, [log]);

  const subscribeToScript = useCallback((scriptId: number) => {
    sendMessage({
      type: 'subscribe_script',
      script_id: scriptId,
    });
  }, [sendMessage]);

  const unsubscribeFromScript = useCallback((scriptId: number) => {
    sendMessage({
      type: 'unsubscribe_script',
      script_id: scriptId,
    });
  }, [sendMessage]);

  const getScriptStatus = useCallback((scriptId: number) => {
    sendMessage({
      type: 'get_script_status',
      script_id: scriptId,
    });
  }, [sendMessage]);

  const getConnectionStats = useCallback(() => {
    sendMessage({
      type: 'get_connection_stats',
    });
  }, [sendMessage]);

  const ping = useCallback() => {
    sendMessage({
      type: 'ping',
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  const onMessage = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.set(type, handler);
    
    return () => {
      messageHandlers.current.delete(type);
    };
  }, []);

  const onAnyMessage = useCallback((handler: (message: WebSocketMessage) => void) => {
    return onMessage('*', handler);
  }, [onMessage]);

  // 컴포넌트 마운트시 연결
  useEffect(() => {
    connect();

    // 컴포넌트 언마운트시 정리
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat (핑) 설정
  useEffect(() => {
    if (!state.isConnected) return;

    const heartbeatInterval = setInterval(() => {
      ping();
    }, 30000); // 30초마다 핑

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [state.isConnected, ping]);

  return {
    // 상태
    ...state,
    
    // 연결 관리
    connect,
    disconnect,
    
    // 메시지 송신
    sendMessage,
    subscribeToScript,
    unsubscribeFromScript,
    getScriptStatus,
    getConnectionStats,
    ping,
    
    // 메시지 수신
    onMessage,
    onAnyMessage,
  };
};

export default useWebSocket;