/**
 * 실시간 알림 표시 패널
 */

import React from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { getNotificationStyle } from '../services/websocket';
import { X, Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationPanelProps {
  className?: string;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  className = '',
  maxNotifications = 5,
  position = 'top-right'
}) => {
  const { notifications, removeNotification, clearNotifications } = useWebSocketContext();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  const displayNotifications = notifications.slice(-maxNotifications);

  if (displayNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Bell className="w-4 h-4" />
          <span>실시간 알림</span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            모두 지우기
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-2">
        {displayNotifications.map((notification, index) => {
          const style = getNotificationStyle(notification.type);
          
          return (
            <div
              key={`${notification.timestamp}-${index}`}
              className={`
                relative p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm
                max-w-sm min-w-80 transition-all duration-300 ease-in-out
                ${style.className}
                bg-opacity-95 hover:bg-opacity-100
              `}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => removeNotification(notifications.length - maxNotifications + index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 알림 내용 */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm opacity-90 break-words">
                    {notification.message}
                  </p>
                  
                  {/* YouTube URL 링크 */}
                  {notification.youtube_url && (
                    <a
                      href={notification.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs underline hover:no-underline"
                    >
                      YouTube에서 보기 →
                    </a>
                  )}
                  
                  {/* 스크립트 ID 표시 */}
                  {notification.script_id && (
                    <div className="text-xs opacity-75 mt-1">
                      스크립트 ID: {notification.script_id}
                    </div>
                  )}
                  
                  {/* 타임스탬프 */}
                  {notification.timestamp && (
                    <div className="text-xs opacity-60 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 더 많은 알림 표시 */}
      {notifications.length > maxNotifications && (
        <div className="text-center">
          <div className="text-xs text-gray-500 bg-white bg-opacity-80 rounded px-2 py-1 inline-block">
            +{notifications.length - maxNotifications}개 더
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;