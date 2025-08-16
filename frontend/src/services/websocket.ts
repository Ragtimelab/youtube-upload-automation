/**
 * WebSocket 서비스 - 실시간 메시지 처리 및 알림 관리
 */

import { WebSocketMessage } from '../hooks/useWebSocket';

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  script_id?: number;
  youtube_url?: string;
  timestamp?: string;
}

export interface ScriptUpdateData {
  status: string;
  message: string;
  script_data: any;
  youtube_url?: string;
}

export interface UploadProgressData {
  script_id: number;
  title: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  total_steps: number;
  estimated_time_remaining?: number;
  video_file_info?: {
    file_size: number;
    file_size_mb: number;
    filename: string;
  };
  youtube_info?: {
    video_id: string;
    url: string;
    scheduled_time?: string;
  };
}

export interface WebSocketHandlers {
  onSystemNotification?: (notification: NotificationData) => void;
  onScriptUpdate?: (scriptId: number, updateData: ScriptUpdateData) => void;
  onUploadProgress?: (scriptId: number, progressData: UploadProgressData) => void;
  onScriptStatus?: (scriptId: number, scriptData: any) => void;
  onConnectionStats?: (stats: any) => void;
  onError?: (error: string) => void;
  onConnectionEstablished?: (connectionId: string) => void;
  onSubscriptionConfirmed?: (scriptId: number, message: string) => void;
  onUnsubscriptionConfirmed?: (scriptId: number, message: string) => void;
}

export class WebSocketMessageHandler {
  private handlers: WebSocketHandlers;
  private debug: boolean;

  constructor(handlers: WebSocketHandlers = {}, debug: boolean = false) {
    this.handlers = handlers;
    this.debug = debug;
  }

  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[WebSocketMessageHandler] ${message}`, ...args);
    }
  }

  public handleMessage = (message: WebSocketMessage) => {
    this.log('메시지 처리:', message);

    try {
      switch (message.type) {
        case 'connection_established':
          this.handleConnectionEstablished(message);
          break;

        case 'system_notification':
          this.handleSystemNotification(message);
          break;

        case 'script_update':
          this.handleScriptUpdate(message);
          break;

        case 'upload_progress':
          this.handleUploadProgress(message);
          break;

        case 'script_status':
          this.handleScriptStatus(message);
          break;

        case 'connection_stats':
          this.handleConnectionStats(message);
          break;

        case 'subscription_confirmed':
          this.handleSubscriptionConfirmed(message);
          break;

        case 'unsubscription_confirmed':
          this.handleUnsubscriptionConfirmed(message);
          break;

        case 'error':
          this.handleError(message);
          break;

        case 'pong':
          this.handlePong(message);
          break;

        case 'initial_data':
          this.handleInitialData(message);
          break;

        default:
          this.log('알 수 없는 메시지 타입:', message.type, message);
          break;
      }
    } catch (error) {
      this.log('메시지 처리 중 오류:', error);
      this.handlers.onError?.(`메시지 처리 오류: ${error}`);
    }
  };

  private handleConnectionEstablished(message: WebSocketMessage) {
    this.log('연결 설정 완료:', message.connection_id);
    this.handlers.onConnectionEstablished?.(message.connection_id);
  }

  private handleSystemNotification(message: WebSocketMessage) {
    const notification: NotificationData = message.notification;
    this.log('시스템 알림:', notification);
    this.handlers.onSystemNotification?.(notification);
  }

  private handleScriptUpdate(message: WebSocketMessage) {
    const scriptId = message.script_id;
    const updateData: ScriptUpdateData = message.data;
    this.log('스크립트 업데이트:', scriptId, updateData);
    this.handlers.onScriptUpdate?.(scriptId, updateData);
  }

  private handleUploadProgress(message: WebSocketMessage) {
    const scriptId = message.script_id;
    const progressData: UploadProgressData = message.progress;
    this.log('업로드 진행률:', scriptId, `${progressData.progress_percentage}%`);
    this.handlers.onUploadProgress?.(scriptId, progressData);
  }

  private handleScriptStatus(message: WebSocketMessage) {
    const scriptId = message.script_id;
    const scriptData = message.data;
    this.log('스크립트 상태:', scriptId, scriptData);
    this.handlers.onScriptStatus?.(scriptId, scriptData);
  }

  private handleConnectionStats(message: WebSocketMessage) {
    const stats = message.data;
    this.log('연결 통계:', stats);
    this.handlers.onConnectionStats?.(stats);
  }

  private handleSubscriptionConfirmed(message: WebSocketMessage) {
    const scriptId = message.script_id;
    const confirmMessage = message.message;
    this.log('구독 확인:', scriptId, confirmMessage);
    this.handlers.onSubscriptionConfirmed?.(scriptId, confirmMessage);
  }

  private handleUnsubscriptionConfirmed(message: WebSocketMessage) {
    const scriptId = message.script_id;
    const confirmMessage = message.message;
    this.log('구독 해제 확인:', scriptId, confirmMessage);
    this.handlers.onUnsubscriptionConfirmed?.(scriptId, confirmMessage);
  }

  private handleError(message: WebSocketMessage) {
    const errorMessage = message.message;
    this.log('오류 메시지:', errorMessage);
    this.handlers.onError?.(errorMessage);
  }

  private handlePong(message: WebSocketMessage) {
    // 핑-퐁 응답 처리 (디버그 로그만)
    this.log('Pong 응답:', message.timestamp);
  }

  private handleInitialData(message: WebSocketMessage) {
    const data = message.data;
    this.log('초기 데이터:', data);
    
    // 스크립트 통계가 있으면 연결 통계 핸들러 호출
    if (data.script_stats && this.handlers.onConnectionStats) {
      this.handlers.onConnectionStats(data);
    }
  }

  public updateHandlers(newHandlers: Partial<WebSocketHandlers>) {
    this.handlers = { ...this.handlers, ...newHandlers };
  }

  public setDebug(debug: boolean) {
    this.debug = debug;
  }
}

// 알림 타입별 스타일링을 위한 유틸리티
export const getNotificationStyle = (type: NotificationData['type']) => {
  switch (type) {
    case 'success':
      return {
        className: 'bg-green-100 border-green-500 text-green-700',
        icon: '✅',
      };
    case 'error':
      return {
        className: 'bg-red-100 border-red-500 text-red-700',
        icon: '❌',
      };
    case 'warning':
      return {
        className: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        icon: '⚠️',
      };
    case 'info':
    default:
      return {
        className: 'bg-blue-100 border-blue-500 text-blue-700',
        icon: 'ℹ️',
      };
  }
};

// 업로드 상태별 진행률 색상
export const getProgressColor = (status: string, percentage: number) => {
  if (status === 'error') {
    return 'bg-red-500';
  }
  
  if (percentage === 100) {
    return 'bg-green-500';
  }
  
  if (percentage > 0) {
    return 'bg-blue-500';
  }
  
  return 'bg-gray-300';
};

// WebSocket URL 생성 유틸리티
export const createWebSocketUrl = (baseUrl: string, userId?: string): string => {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  
  if (userId) {
    url.searchParams.set('user_id', userId);
  }
  
  return url.toString();
};

export default WebSocketMessageHandler;