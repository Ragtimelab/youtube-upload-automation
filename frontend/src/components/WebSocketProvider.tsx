/**
 * WebSocket 연결 상태 관리를 위한 Context Provider
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import useWebSocket, { WebSocketState } from '../hooks/useWebSocket';
import { WebSocketMessageHandler, WebSocketHandlers, NotificationData, ScriptUpdateData, UploadProgressData } from '../services/websocket';

interface WebSocketContextType extends WebSocketState {
  // 연결 관리
  connect: () => void;
  disconnect: () => void;
  
  // 메시지 송신
  subscribeToScript: (scriptId: number) => void;
  unsubscribeFromScript: (scriptId: number) => void;
  getScriptStatus: (scriptId: number) => void;
  getConnectionStats: () => void;
  
  // 알림 관리
  notifications: NotificationData[];
  clearNotifications: () => void;
  removeNotification: (index: number) => void;
  
  // 스크립트 업데이트 추적
  scriptUpdates: Map<number, ScriptUpdateData>;
  uploadProgress: Map<number, UploadProgressData>;
  
  // 메시지 핸들러 등록
  setMessageHandlers: (handlers: Partial<WebSocketHandlers>) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  wsUrl: string;
  userId?: string;
  debug?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  wsUrl,
  userId,
  debug = false
}) => {
  // WebSocket 훅 사용
  const websocket = useWebSocket({
    url: wsUrl,
    userId,
    debug,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // 알림 상태 관리
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [scriptUpdates, setScriptUpdates] = useState<Map<number, ScriptUpdateData>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<number, UploadProgressData>>(new Map());

  // 메시지 핸들러 생성
  const [messageHandler] = useState(() => new WebSocketMessageHandler({
    onSystemNotification: (notification: NotificationData) => {
      setNotifications(prev => [...prev, notification]);
      
      // 5초 후 자동 제거 (에러는 10초)
      const timeout = notification.type === 'error' ? 10000 : 5000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, timeout);
    },

    onScriptUpdate: (scriptId: number, updateData: ScriptUpdateData) => {
      setScriptUpdates(prev => new Map(prev.set(scriptId, updateData)));
    },

    onUploadProgress: (scriptId: number, progressData: UploadProgressData) => {
      setUploadProgress(prev => new Map(prev.set(scriptId, progressData)));
    },

    onConnectionEstablished: (connectionId: string) => {
      console.log('WebSocket 연결 설정:', connectionId);
    },

    onSubscriptionConfirmed: (scriptId: number, message: string) => {
      console.log('구독 확인:', scriptId, message);
    },

    onUnsubscriptionConfirmed: (scriptId: number, message: string) => {
      console.log('구독 해제 확인:', scriptId, message);
    },

    onError: (error: string) => {
      console.error('WebSocket 오류:', error);
    },

    onConnectionStats: (stats: any) => {
      console.log('연결 통계:', stats);
    },

    onScriptStatus: (scriptId: number, scriptData: any) => {
      console.log('스크립트 상태:', scriptId, scriptData);
    },
  }, debug));

  // WebSocket 메시지 핸들링 설정
  useEffect(() => {
    const unsubscribe = websocket.onAnyMessage(messageHandler.handleMessage);
    return unsubscribe;
  }, [websocket, messageHandler]);

  // 알림 관리 함수
  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // 메시지 핸들러 업데이트
  const setMessageHandlers = (handlers: Partial<WebSocketHandlers>) => {
    messageHandler.updateHandlers(handlers);
  };

  // 연결 상태 변화 로깅
  useEffect(() => {
    if (debug) {
      console.log('WebSocket 상태 변화:', {
        isConnected: websocket.isConnected,
        isConnecting: websocket.isConnecting,
        connectionId: websocket.connectionId,
        error: websocket.error,
        reconnectAttempts: websocket.reconnectAttempts,
      });
    }
  }, [
    websocket.isConnected,
    websocket.isConnecting,
    websocket.connectionId,
    websocket.error,
    websocket.reconnectAttempts,
    debug
  ]);

  const contextValue: WebSocketContextType = {
    // WebSocket 상태
    ...websocket,
    
    // 알림 관리
    notifications,
    clearNotifications,
    removeNotification,
    
    // 업데이트 추적
    scriptUpdates,
    uploadProgress,
    
    // 핸들러 설정
    setMessageHandlers,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;