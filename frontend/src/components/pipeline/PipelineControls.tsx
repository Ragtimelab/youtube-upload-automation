/**
 * 파이프라인 제어 패널 컴포넌트
 * 실시간 모니터링, 새로고침, 애니메이션 제어
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Monitor,
  Activity,
  Workflow
} from 'lucide-react'

interface PipelineControlsProps {
  isRealTimeEnabled: boolean
  animationEnabled: boolean
  isLoading: boolean
  lastRefresh: Date
  connectionStatus: string
  onToggleRealTime: () => void
  onToggleAnimation: (enabled: boolean) => void
  onRefresh: () => void
}

export function PipelineControls({
  isRealTimeEnabled,
  animationEnabled,
  isLoading,
  lastRefresh,
  connectionStatus,
  onToggleRealTime,
  onToggleAnimation,
  onRefresh
}: PipelineControlsProps) {
  const getConnectionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConnectionStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return '연결됨'
      case 'connecting':
        return '연결 중'
      case 'error':
        return '연결 오류'
      default:
        return '연결 안됨'
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border-b">
      {/* 페이지 제목 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Workflow className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">파이프라인 모니터링</h1>
          <p className="text-gray-600">실시간 처리 현황 및 성능 분석</p>
        </div>
      </div>

      {/* 제어 버튼들 */}
      <div className="flex items-center gap-3">
        {/* 연결 상태 */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus.toLowerCase() === 'connected' ? 'bg-green-500' :
            connectionStatus.toLowerCase() === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <Badge className={getConnectionStatusColor(connectionStatus)}>
            <Monitor className="h-3 w-3 mr-1" />
            {getConnectionStatusText(connectionStatus)}
          </Badge>
        </div>

        {/* 실시간 모니터링 토글 */}
        <Button
          variant={isRealTimeEnabled ? "default" : "outline"}
          size="sm"
          onClick={onToggleRealTime}
          className="flex items-center gap-2"
        >
          {isRealTimeEnabled ? (
            <>
              <Activity className="h-4 w-4" />
              실시간 ON
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              실시간 OFF
            </>
          )}
        </Button>

        {/* 애니메이션 토글 */}
        <Button
          variant={animationEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleAnimation(!animationEnabled)}
          className="flex items-center gap-2"
        >
          {animationEnabled ? (
            <>
              <Play className="h-4 w-4" />
              애니메이션 ON
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              애니메이션 OFF
            </>
          )}
        </Button>

        {/* 새로고침 */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 마지막 업데이트 시간 */}
      {lastRefresh && (
        <div className="text-sm text-gray-500">
          마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
        </div>
      )}
    </div>
  )
}