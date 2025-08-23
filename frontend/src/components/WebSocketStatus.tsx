import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react'

interface WebSocketStatusProps {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string | null
  reconnectAttempts?: number
  className?: string
}

export function WebSocketStatus({ 
  isConnected: _isConnected, 
  connectionStatus, 
  error, 
  reconnectAttempts = 0,
  className 
}: WebSocketStatusProps) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: '연결 중...',
          variant: 'secondary' as const,
          bgColor: 'bg-blue-100 text-blue-800'
        }
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: '실시간 연결됨',
          variant: 'default' as const,
          bgColor: 'bg-green-100 text-green-800'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: reconnectAttempts > 0 ? `재연결 시도 중... (${reconnectAttempts})` : '연결 끊김',
          variant: 'secondary' as const,
          bgColor: 'bg-gray-100 text-gray-800'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: error ? '연결 오류' : '오류',
          variant: 'destructive' as const,
          bgColor: 'bg-red-100 text-red-800'
        }
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: '알 수 없음',
          variant: 'secondary' as const,
          bgColor: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.variant}
        className={`${config.bgColor} border-0`}
      >
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
      
      {error && (
        <span className="text-xs text-red-600 max-w-xs truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}