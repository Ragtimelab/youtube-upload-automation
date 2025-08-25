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
import { Environment } from '@/utils/ssrHelpers'
import { ProfiledComponent } from '@/utils/performanceAnalyzer'
import { COMMON_STYLES, LAYOUT_STYLES } from '@/constants/styles'
import { PAGE_TEXT, UI_TEXT } from '@/constants/text'
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

  // SSR 호환성 체크
  if (Environment.isServer()) {
    return (
      <div className={`${LAYOUT_STYLES.container.page} p-8`}>
        <div className={LAYOUT_STYLES.container.main}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{PAGE_TEXT.dashboard.title}</h1>
          <p className={`${COMMON_STYLES.text.pageDescription} mb-8`}>{PAGE_TEXT.dashboard.description}</p>
          <div className="text-center py-12">
            <p className={COMMON_STYLES.text.label}>{PAGE_TEXT.dashboard.serverRendering}</p>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <FullScreenLoading
        message={PAGE_TEXT.dashboard.systemLoading}
        title={PAGE_TEXT.dashboard.title}
      />
    )
  }

  return (
    <ProfiledComponent name="DashboardPage">
      <div className={cn(commonLayouts.fullScreen, commonLayouts.padding)}>
      <div className={commonLayouts.container}>
        {/* 헤더 */}
        <div className="mb-8">
          <div className={commonLayouts.flexBetween}>
            <div>
              <h1 className={cn(commonLayouts.title, 'mb-2')}>{PAGE_TEXT.dashboard.title}</h1>
              <p className={commonLayouts.subtitle}>{PAGE_TEXT.dashboard.description}</p>
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
                  실시간 {isRealTimeEnabled ? PAGE_TEXT.dashboard.realTimeOn : PAGE_TEXT.dashboard.realTimeOff}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className={commonLayouts.flexGapSm}
                >
                  <RefreshCw className="h-4 w-4" />
                  {UI_TEXT.common.refresh}
                </Button>
              </div>
              
              <div className={commonLayouts.smallText}>
                {PAGE_TEXT.dashboard.lastUpdate}: {formatFullTime(lastRefresh)}
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
    </ProfiledComponent>
  )
}