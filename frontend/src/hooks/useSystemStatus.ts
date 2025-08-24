import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { systemApi, scriptApi } from '@/services/api'
import type { Script } from '@/types/api'
import type { SystemMetrics as DashboardSystemMetrics, PipelineStats as DashboardPipelineStats } from '@/types/dashboard'

export interface SystemHealth {
  status: string
  timestamp: string
  services: {
    api: 'healthy' | 'degraded' | 'down'
    database: 'healthy' | 'degraded' | 'down'
    websocket: 'healthy' | 'degraded' | 'down'
    youtube: 'healthy' | 'degraded' | 'down'
  }
  uptime: number
  version: string
}

// 기존 타입들을 dashboard 타입과 호환되도록 확장
export interface SystemMetrics extends DashboardSystemMetrics {}
export interface PipelineStats extends DashboardPipelineStats {}

export function useSystemStatus() {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // 헬스체크 쿼리
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: systemApi.healthCheck,
    refetchInterval: isRealTimeEnabled ? 30000 : false, // 30초마다 자동 새로고침
    staleTime: 15000, // 15초간 fresh 상태 유지
  })

  // 시스템 상태 쿼리
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: systemApi.getSystemStatus,
    refetchInterval: isRealTimeEnabled ? 60000 : false, // 1분마다 자동 새로고침
    staleTime: 30000,
  })

  // 스크립트 데이터 쿼리 (메트릭 계산용)
  const { data: scriptsData, isLoading: scriptsLoading, refetch: refetchScripts } = useQuery({
    queryKey: ['scripts-metrics', 1, 1000], // 대량 데이터 조회
    queryFn: () => scriptApi.getScripts(1, 1000),
    refetchInterval: isRealTimeEnabled ? 120000 : false, // 2분마다
    staleTime: 60000,
  })

  // 시스템 메트릭 계산
  const calculateSystemMetrics = useCallback((scripts: Script[]): SystemMetrics => {
    const scriptsByStatus = {
      script_ready: scripts.filter(s => s.status === 'script_ready').length,
      video_ready: scripts.filter(s => s.status === 'video_ready').length,
      uploaded: scripts.filter(s => s.status === 'uploaded').length,
      error: scripts.filter(s => s.status === 'error').length,
    }

    const uploadedScripts = scripts.filter(s => s.status === 'uploaded')
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const uploadsToday = uploadedScripts.filter(s => 
      new Date(s.updated_at).toDateString() === today.toDateString()
    ).length

    const uploadsThisWeek = uploadedScripts.filter(s => 
      new Date(s.updated_at) >= weekAgo
    ).length

    const uploadsThisMonth = uploadedScripts.filter(s => 
      new Date(s.updated_at) >= monthAgo
    ).length

    const lastUpload = uploadedScripts
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

    // 전체 스크립트 기준 처리 현황
    const totalScripts = scripts.length
    const overallSuccessRate = totalScripts > 0 ? (scriptsByStatus.uploaded / totalScripts) * 100 : 0
    const overallErrorRate = totalScripts > 0 ? (scriptsByStatus.error / totalScripts) * 100 : 0

    // 시간당 처리량 계산 (최근 24시간 기준)
    const throughputPerHour = uploadsToday > 0 ? Math.round(uploadsToday / 24 * 100) / 100 : 0

    return {
      totalScripts: scripts.length,
      scriptsByStatus: {
        ...scriptsByStatus,
        scheduled: 0 // TODO: 예약된 스크립트 수 계산
      },
      recentActivity: {
        uploadsToday,
        uploadsThisWeek,
        uploadsThisMonth,
        lastUploadTime: lastUpload?.updated_at,
      },
      performance: {
        avgUploadTime: 45, // 평균 45초 (실제로는 계산 필요)
        successRate: Math.round(overallSuccessRate * 100) / 100,
        errorRate: Math.round(overallErrorRate * 100) / 100,
        throughputPerHour
      }
    }
  }, [])

  // 파이프라인 통계 계산
  const calculatePipelineStats = useCallback((scripts: Script[]): PipelineStats => {
    const stages = [
      {
        name: 'Scripts Ready',
        count: scripts.filter(s => s.status === 'script_ready').length,
        percentage: 0,
        status: 'normal' as const
      },
      {
        name: 'Videos Ready', 
        count: scripts.filter(s => s.status === 'video_ready').length,
        percentage: 0,
        status: 'normal' as const
      },
      {
        name: 'Uploaded',
        count: scripts.filter(s => s.status === 'uploaded').length,
        percentage: 0,
        status: 'normal' as const
      },
      {
        name: 'Errors',
        count: scripts.filter(s => s.status === 'error').length,
        percentage: 0,
        status: 'error' as const
      }
    ]

    const totalActive = stages.reduce((sum, stage) => sum + stage.count, 0)
    stages.forEach(stage => {
      stage.percentage = totalActive > 0 ? Math.round((stage.count / totalActive) * 100) : 0
    })

    // 병목 구간 감지
    const bottlenecks = []
    if (stages[0].count > stages[1].count * 2) {
      bottlenecks.push('Video upload bottleneck detected')
    }
    if (stages[1].count > stages[2].count * 3) {
      bottlenecks.push('YouTube upload bottleneck detected')
    }
    if (stages[3].count > totalActive * 0.1) {
      bottlenecks.push('High error rate detected')
    }

    // 파이프라인 효율성 계산 (완료율 기준)
    const completedCount = stages.find(s => s.name === 'Uploaded')?.count || 0
    const efficiency = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0

    return {
      stages,
      bottlenecks,
      throughput: {
        daily: Math.round(totalActive / 30), // 월간 평균을 일간으로 환산
        weekly: Math.round(totalActive / 4), // 월간을 주간으로 환산
        monthly: totalActive,
      },
      efficiency
    }
  }, [])

  // 실시간 업데이트 토글
  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev)
  }, [])

  // 수동 새로고침
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchHealth(),
      refetchStatus(),
      refetchScripts()
    ])
    setLastRefresh(new Date())
  }, [refetchHealth, refetchStatus, refetchScripts])

  // 시스템 상태 종합 분석
  const getOverallStatus = useCallback(() => {
    if (!healthData || !statusData) return 'unknown'
    
    // API 응답 구조에 맞게 수정: success 필드로 판단
    if ((healthData as { success?: boolean })?.success === true) return 'healthy'
    if ((statusData as { error?: unknown })?.error) return 'error'
    return 'degraded'
  }, [healthData, statusData])

  // 계산된 메트릭
  const systemMetrics = scriptsData?.items ? calculateSystemMetrics(scriptsData.items) : null
  const pipelineStats = scriptsData?.items ? calculatePipelineStats(scriptsData.items) : null

  return {
    // 원시 데이터
    healthData,
    statusData,
    scriptsData: scriptsData?.items || [],
    
    // 로딩 상태
    isLoading: healthLoading || statusLoading || scriptsLoading,
    
    // 계산된 메트릭
    systemMetrics,
    pipelineStats,
    
    // 상태 관리
    isRealTimeEnabled,
    lastRefresh,
    overallStatus: getOverallStatus(),
    
    // 액션
    toggleRealTime,
    refreshAll,
  }
}