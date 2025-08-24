import { Button } from '@/components/ui/button'
import { FullScreenLoading } from '@/components/ui/Loading'
import { SystemStatusCards } from '@/components/dashboard/SystemStatusCards'
import { ServiceStatusPanel } from '@/components/dashboard/ServiceStatusPanel'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics'
import { SystemAlerts } from '@/components/dashboard/SystemAlerts'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatFullTime } from '@/utils/dateFormat'
import { commonLayouts, cn } from '@/utils/classNames'
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
      <FullScreenLoading
        message="시스템 상태를 불러오는 중..."
        title="대시보드 로딩"
      />
    )
  }

  return (
    <div className={cn(commonLayouts.fullScreen, commonLayouts.padding)}>
      <div className={commonLayouts.container}>
        {/* 헤더 */}
        <div className="mb-8">
          <div className={commonLayouts.flexBetween}>
            <div>
              <h1 className={cn(commonLayouts.title, 'mb-2')}>시스템 대시보드</h1>
              <p className={commonLayouts.subtitle}>YouTube 업로드 자동화 시스템 실시간 모니터링</p>
            </div>
            
            {/* 컨트롤 패널 */}
            <div className={commonLayouts.flexGapMd}>
              <WebSocketStatus 
                isConnected={webSocketState.isConnected}
                connectionStatus={webSocketState.connectionStatus}
                error={webSocketState.error}
              />
              
              <div className={commonLayouts.flexGapSm}>
                <Button
                  variant={isRealTimeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleRealTime}
                  className={commonLayouts.flexGapSm}
                >
                  <Activity className={`h-4 w-4 ${isRealTimeEnabled ? 'animate-pulse' : ''}`} />
                  실시간 {isRealTimeEnabled ? '켜짐' : '꺼짐'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className={commonLayouts.flexGapSm}
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </Button>
              </div>
              
              <div className={commonLayouts.smallText}>
                마지막 업데이트: {formatFullTime(lastRefresh)}
              </div>
            </div>
          </div>
        </div>

        {/* 전체 시스템 상태 카드 */}
        <SystemStatusCards
          totalScripts={systemMetrics?.totalScripts || 0}
          videoReady={systemMetrics?.scriptsByStatus.video_ready || 0}
          uploaded={systemMetrics?.scriptsByStatus.uploaded || 0}
          activeUploads={globalStats?.activeUploads || 0}
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
        <div className={cn(commonLayouts.gridCols2, 'lg:grid-cols-2', commonLayouts.gapXl, 'mb-8')}>
          <PerformanceMetrics
            performanceData={performanceData}
            avgUploadTime={systemMetrics?.performance.avgUploadTime || 0}
          />

          <SystemAlerts
            bottlenecks={[]}
            activeUploads={globalStats?.activeUploads || 0}
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