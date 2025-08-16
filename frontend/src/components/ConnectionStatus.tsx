/**
 * WebSocket 연결 상태 표시 컴포넌트
 */

import React from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    isConnected, 
    isConnecting, 
    connectionId, 
    error, 
    reconnectAttempts,
    connect,
    disconnect 
  } = useWebSocketContext();

  const getStatusColor = () => {
    if (isConnected) return 'text-green-500';
    if (isConnecting) return 'text-yellow-500';
    if (error) return 'text-red-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (isConnected) return '연결됨';
    if (isConnecting) return '연결 중...';
    if (error) return '연결 오류';
    return '연결 안됨';
  };

  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="w-4 h-4" />;
    if (isConnecting) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          {connectionId && (
            <div>ID: {connectionId.slice(-8)}</div>
          )}
          
          {reconnectAttempts > 0 && (
            <div>재연결 시도: {reconnectAttempts}</div>
          )}
          
          {error && (
            <div className="text-red-500 max-w-xs truncate" title={error}>
              오류: {error}
            </div>
          )}
        </div>
      )}

      {/* 연결 제어 버튼 */}
      <div className="flex space-x-1">
        {!isConnected && !isConnecting && (
          <button
            onClick={connect}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            연결
          </button>
        )}
        
        {isConnected && (
          <button
            onClick={disconnect}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            해제
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;