import { useMemo } from 'react'
import { useSystemStatus } from './useSystemStatus'
import { useUploadProgress } from './useUploadProgress'
import { UI_CONSTANTS } from '@/constants/ui'

interface StatusDistribution {
  name: string
  value: number
  color: string
  percentage: number
}

interface PipelineStage {
  name: string
  count: number
  percentage: number
}

interface PerformanceData {
  name: string
  value: number
  color: string
}

interface RecentActivityData {
  uploadsToday: number
  uploadsThisWeek: number
  uploadsThisMonth: number
  lastUploadTime?: string
}

interface DashboardDataReturn {
  // 기본 데이터
  systemMetrics: any
  pipelineStats: any
  isLoading: boolean
  isRealTimeEnabled: boolean
  lastRefresh: Date
  overallStatus: string
  webSocketState: any
  globalStats: any
  
  // 처리된 데이터
  statusDistributionData: StatusDistribution[]
  pipelineData: PipelineStage[]
  performanceData: PerformanceData[]
  recentActivity: RecentActivityData
  
  // 액션
  toggleRealTime: () => void
  refreshAll: () => void
}

export function useDashboardData(): DashboardDataReturn {
  const {
    systemMetrics,
    pipelineStats,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    toggleRealTime,
    refreshAll
  } = useSystemStatus()

  const { webSocketState, globalStats } = useUploadProgress()

  // 상태별 분포 데이터 처리
  const statusDistributionData = useMemo((): StatusDistribution[] => {
    if (!systemMetrics) return []
    
    const total = systemMetrics.totalScripts
    return [
      { 
        name: '스크립트만', 
        value: systemMetrics.scriptsByStatus.script_ready, 
        color: UI_CONSTANTS.COLORS.secondary,
        percentage: total > 0 ? Math.round((systemMetrics.scriptsByStatus.script_ready / total) * 100) : 0
      },
      { 
        name: '비디오 준비', 
        value: systemMetrics.scriptsByStatus.video_ready, 
        color: UI_CONSTANTS.COLORS.warning,
        percentage: total > 0 ? Math.round((systemMetrics.scriptsByStatus.video_ready / total) * 100) : 0
      },
      { 
        name: '업로드 완료', 
        value: systemMetrics.scriptsByStatus.uploaded, 
        color: UI_CONSTANTS.COLORS.success,
        percentage: total > 0 ? Math.round((systemMetrics.scriptsByStatus.uploaded / total) * 100) : 0
      },
      { 
        name: '오류', 
        value: systemMetrics.scriptsByStatus.error, 
        color: UI_CONSTANTS.COLORS.error,
        percentage: total > 0 ? Math.round((systemMetrics.scriptsByStatus.error / total) * 100) : 0
      }
    ]
  }, [systemMetrics])

  // 파이프라인 데이터 처리
  const pipelineData = useMemo((): PipelineStage[] => {
    return pipelineStats?.stages.map(stage => ({
      name: stage.name,
      count: stage.count,
      percentage: stage.percentage
    })) || []
  }, [pipelineStats])

  // 성능 데이터 처리
  const performanceData = useMemo((): PerformanceData[] => {
    if (!systemMetrics) return []
    
    return [
      { name: '성공률', value: systemMetrics.performance.successRate, color: UI_CONSTANTS.COLORS.success },
      { name: '오류율', value: systemMetrics.performance.errorRate, color: UI_CONSTANTS.COLORS.error }
    ]
  }, [systemMetrics])

  // 최근 활동 데이터 처리
  const recentActivity = useMemo((): RecentActivityData => {
    return {
      uploadsToday: systemMetrics?.recentActivity.uploadsToday || 0,
      uploadsThisWeek: systemMetrics?.recentActivity.uploadsThisWeek || 0,
      uploadsThisMonth: systemMetrics?.recentActivity.uploadsThisMonth || 0,
      lastUploadTime: systemMetrics?.recentActivity.lastUploadTime
    }
  }, [systemMetrics])

  return {
    // 기본 데이터
    systemMetrics,
    pipelineStats,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    webSocketState,
    globalStats,
    
    // 처리된 데이터
    statusDistributionData,
    pipelineData,
    performanceData,
    recentActivity,
    
    // 액션
    toggleRealTime,
    refreshAll
  }
}