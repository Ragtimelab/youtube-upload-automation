import React, { useState, useEffect } from 'react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { PipelineFlow } from '@/components/PipelineFlow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Workflow, 
  FileText, 
  Video, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity,
  RefreshCw,
  Play,
  Pause,
  TrendingUp,
  Target,
  Zap,
  Monitor,
  BarChart3
} from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  count: number
  percentage: number
  status: 'normal' | 'warning' | 'error' | 'processing'
  icon: React.ComponentType<{ className?: string }>
  description: string
  avgProcessingTime: number
  lastProcessed?: string
}

interface PipelineFlow {
  from: string
  to: string
  throughput: number
  status: 'active' | 'blocked' | 'slow'
}

export function PipelinePage() {
  const {
    systemMetrics,
    pipelineStats,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus: _overallStatus,
    toggleRealTime,
    refreshAll,
  } = useSystemStatus()

  const { webSocketState, globalStats, getActiveUploads: _getActiveUploads } = useUploadProgress()
  
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [animationEnabled, setAnimationEnabled] = useState(true)

  // 파이프라인 단계 정의
  const pipelineStages: PipelineStage[] = [
    {
      id: 'script_ready',
      name: '스크립트 준비',
      count: systemMetrics?.scriptsByStatus.script_ready || 0,
      percentage: 0,
      status: 'normal',
      icon: FileText,
      description: '업로드된 스크립트 파일들',
      avgProcessingTime: 0,
      lastProcessed: '-'
    },
    {
      id: 'video_ready',
      name: '비디오 준비',
      count: systemMetrics?.scriptsByStatus.video_ready || 0,
      percentage: 0,
      status: 'processing',
      icon: Video,
      description: '비디오 파일이 연결된 스크립트',
      avgProcessingTime: 0,
      lastProcessed: '-'
    },
    {
      id: 'uploading',
      name: '업로드 중',
      count: globalStats.activeUploads || 0,
      percentage: 0,
      status: globalStats.activeUploads > 0 ? 'processing' : 'normal',
      icon: Upload,
      description: 'YouTube에 업로드 진행 중',
      avgProcessingTime: 0,
      lastProcessed: '-'
    },
    {
      id: 'uploaded',
      name: '업로드 완료',
      count: systemMetrics?.scriptsByStatus.uploaded || 0,
      percentage: 0,
      status: 'normal',
      icon: CheckCircle2,
      description: '성공적으로 업로드된 비디오',
      avgProcessingTime: 0,
      lastProcessed: '-'
    },
    {
      id: 'error',
      name: '오류 발생',
      count: systemMetrics?.scriptsByStatus.error || 0,
      percentage: 0,
      status: (systemMetrics?.scriptsByStatus.error || 0) > 0 ? 'error' : 'normal',
      icon: AlertTriangle,
      description: '처리 중 오류가 발생한 항목',
      avgProcessingTime: 0,
      lastProcessed: '30분 전'
    }
  ]

  // 퍼센티지 계산
  const totalItems = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)
  pipelineStages.forEach(stage => {
    stage.percentage = totalItems > 0 ? Math.round((stage.count / totalItems) * 100) : 0
  })

  // 파이프라인 플로우 정의
  const pipelineFlows: PipelineFlow[] = [
    {
      from: 'script_ready',
      to: 'video_ready',
      throughput: Math.max(0, (systemMetrics?.scriptsByStatus.script_ready || 0) - (systemMetrics?.scriptsByStatus.video_ready || 0)),
      status: 'active'
    },
    {
      from: 'video_ready',
      to: 'uploading',
      throughput: globalStats.activeUploads || 0,
      status: (globalStats.activeUploads > 0 ? 'active' : 'blocked') as 'active' | 'blocked' | 'slow'
    },
    {
      from: 'uploading',
      to: 'uploaded', 
      throughput: Math.max(0, globalStats.completedUploads - (systemMetrics?.scriptsByStatus.uploaded || 0)),
      status: 'active'
    }
  ]

  const getStageStatusColor = (status: string, count: number) => {
    if (status === 'error') return 'border-red-500 bg-red-50'
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50'
    if (status === 'processing') return 'border-blue-500 bg-blue-50'
    if (count === 0) return 'border-gray-300 bg-gray-50'
    return 'border-green-500 bg-green-50'
  }

  const getStageIconColor = (status: string, count: number) => {
    if (status === 'error') return 'text-red-600'
    if (status === 'warning') return 'text-yellow-600'
    if (status === 'processing') return 'text-blue-600'
    if (count === 0) return 'text-gray-400'
    return 'text-green-600'
  }

  // const _getFlowStatus = (_flow: PipelineFlow) => {
  //   if (_flow.throughput === 0) return 'opacity-30'
  //   if (_flow.status === 'active') return 'opacity-100 animate-pulse'
  //   if (_flow.status === 'blocked') return 'opacity-50 text-red-500'
  //   return 'opacity-70'
  // }

  // 실제 파이프라인 데이터 새로고침 (의미있는 업데이트만)
  useEffect(() => {
    if (!animationEnabled) return

    // 실제 데이터가 변경될 때만 업데이트하도록 수정
    // 현재는 불필요한 강제 리렌더링 제거
    
  }, [animationEnabled])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">파이프라인 데이터를 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">파이프라인 시각화</h1>
              <p className="text-gray-600">스크립트 처리 과정의 실시간 흐름 모니터링</p>
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
                  variant={animationEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnimationEnabled(!animationEnabled)}
                  className="flex items-center gap-2"
                >
                  {animationEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {animationEnabled ? '애니메이션 켜짐' : '애니메이션 꺼짐'}
                </Button>
                
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

        {/* 파이프라인 개요 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              파이프라인 현황 개요
            </CardTitle>
            <CardDescription>전체 처리 단계별 항목 수와 처리 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pipelineStages.map((stage) => {
                const Icon = stage.icon
                const isSelected = selectedStage === stage.id
                
                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedStage(isSelected ? null : stage.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      getStageStatusColor(stage.status, stage.count)
                    } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-6 w-6 ${getStageIconColor(stage.status, stage.count)}`} />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{stage.count}</div>
                        <div className="text-xs text-gray-600">{stage.percentage}%</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900 text-sm">{stage.name}</h4>
                      <p className="text-xs text-gray-600">{stage.description}</p>
                      {stage.avgProcessingTime > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          평균 {stage.avgProcessingTime}초
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 파이프라인 플로우 다이어그램 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              파이프라인 플로우
            </CardTitle>
            <CardDescription>데이터 처리 흐름과 병목 현상 실시간 모니터링</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFlow
              stages={pipelineStages}
              flows={pipelineFlows}
              isAnimated={animationEnabled}
              onStageClick={setSelectedStage}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 처리 성능 지표 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                처리 성능 지표
              </CardTitle>
              <CardDescription>각 단계별 평균 처리 시간과 효율성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStages.filter(stage => stage.avgProcessingTime > 0).map((stage) => {
                  const Icon = stage.icon
                  return (
                    <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">평균</span>
                        <span className="font-bold text-blue-600">{stage.avgProcessingTime}초</span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">전체 파이프라인 처리율</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-600">
                        {systemMetrics?.performance.successRate.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 병목 현상 및 최적화 제안 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                병목 현상 분석
              </CardTitle>
              <CardDescription>처리 속도 저하 구간과 최적화 방안</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStats?.bottlenecks.length ? (
                  pipelineStats.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">병목 구간 감지</p>
                        <p className="text-sm text-yellow-700">{bottleneck}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">파이프라인 최적화됨</p>
                      <p className="text-sm text-green-700">모든 처리 단계가 효율적으로 작동 중입니다.</p>
                    </div>
                  </div>
                )}

                {/* 처리량 통계 */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">처리량 통계</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {pipelineStats?.throughput.daily || 0}
                      </div>
                      <div className="text-sm text-blue-700">일간</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {pipelineStats?.throughput.weekly || 0}
                      </div>
                      <div className="text-sm text-green-700">주간</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {pipelineStats?.throughput.monthly || 0}
                      </div>
                      <div className="text-sm text-purple-700">월간</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상세 정보 패널 */}
        {selectedStage && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {pipelineStages.find(s => s.id === selectedStage)?.name} 상세 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const stage = pipelineStages.find(s => s.id === selectedStage)
                if (!stage) return null

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">현재 상태</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">처리 중인 항목</span>
                          <span className="font-medium">{stage.count}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">전체 비율</span>
                          <span className="font-medium">{stage.percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">마지막 처리</span>
                          <span className="font-medium">{stage.lastProcessed}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">성능 지표</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">평균 처리 시간</span>
                          <span className="font-medium">{stage.avgProcessingTime}초</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">상태</span>
                          <Badge className={
                            stage.status === 'error' ? 'bg-red-100 text-red-800' :
                            stage.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            stage.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {stage.status === 'normal' ? '정상' :
                             stage.status === 'processing' ? '처리중' :
                             stage.status === 'warning' ? '주의' : '오류'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">설명</h4>
                      <p className="text-gray-600 text-sm">{stage.description}</p>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}