import { Button } from '@/components/ui/button'
import { SystemStatusCards } from '@/components/dashboard/SystemStatusCards'
import { ServiceStatusPanel } from '@/components/dashboard/ServiceStatusPanel'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics'
import { SystemAlerts } from '@/components/dashboard/SystemAlerts'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Activity, RefreshCw } from 'lucide-react'

export function DashboardPage() {
  const {
    systemMetrics,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    webSocketState,
    globalStats,
    statusDistributionData,
    pipelineData,
    performanceData,
    recentActivity,
    toggleRealTime,
    refreshAll
  } = useDashboardData()

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시스템 상태를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 대시보드</h1>
              <p className="text-gray-600">YouTube 업로드 자동화 시스템 실시간 모니터링</p>
            </div>
            
            {/* 컨트롤 패널 */}
            <div className="flex items-center gap-4">
              <WebSocketStatus 
                isConnected={webSocketState.isConnected}
                connectionStatus={webSocketState.connectionStatus}
                error={webSocketState.error}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  variant={isRealTimeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleRealTime}
                  className="flex items-center gap-2"
                >
                  <Activity className={`h-4 w-4 ${isRealTimeEnabled ? 'animate-pulse' : ''}`} />
                  실시간 {isRealTimeEnabled ? '켜짐' : '꺼짐'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>
        </div>

        {/* 전체 시스템 상태 카드 */}
        <SystemStatusCards
          totalScripts={systemMetrics?.totalScripts || 0}
          videoReady={systemMetrics?.scriptsByStatus.video_ready || 0}
          uploaded={systemMetrics?.scriptsByStatus.uploaded || 0}
          activeUploads={globalStats.activeUploads}
        />

        {/* 서비스 상태 패널 */}
        <ServiceStatusPanel
          overallStatus={overallStatus}
          isWebSocketConnected={webSocketState.isConnected}
        />

        {/* 차트 섹션 */}
        <DashboardCharts
          statusDistributionData={statusDistributionData}
          pipelineData={pipelineData}
        />

        {/* 성능 지표 및 병목 현상 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PerformanceMetrics
            performanceData={performanceData}
            avgUploadTime={systemMetrics?.performance.avgUploadTime || 0}
          />

          <SystemAlerts
            bottlenecks={[]}
            activeUploads={globalStats.activeUploads}
          />
        </div>

        {/* 최근 활동 요약 */}
        <RecentActivity
          recentActivity={recentActivity}
        />
      </div>
    </div>
  )
}