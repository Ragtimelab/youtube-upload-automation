import React from 'react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Video,
  Upload,
  Zap,
  Server,
  Database,
  Wifi,
  Youtube,
  BarChart3,
  PieChart as PieChartIcon,
  Timer,
  Target
} from 'lucide-react'

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444',
  secondary: '#6B7280',
  accent: '#8B5CF6'
}

export function DashboardPage() {
  const {
    systemMetrics,
    pipelineStats,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    toggleRealTime,
    refreshAll,
    healthData,
    statusData
  } = useSystemStatus()

  const { webSocketState, globalStats } = useUploadProgress()

  // 시스템 상태 카드 데이터
  const systemStatusCards = [
    {
      title: '전체 스크립트',
      value: systemMetrics?.totalScripts || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      title: '업로드 준비됨',
      value: systemMetrics?.scriptsByStatus.video_ready || 0,
      icon: Video,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200'
    },
    {
      title: '업로드 완료',
      value: systemMetrics?.scriptsByStatus.uploaded || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    {
      title: '실시간 업로드',
      value: globalStats.activeUploads,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ]

  // 서비스 상태 데이터
  const serviceStatus = [
    { name: 'API Server', status: overallStatus, icon: Server },
    { name: 'Database', status: 'healthy', icon: Database },
    { name: 'WebSocket', status: webSocketState.isConnected ? 'healthy' : 'error', icon: Wifi },
    { name: 'YouTube API', status: 'healthy', icon: Youtube }
  ]

  // 차트 데이터 준비
  const statusDistributionData = systemMetrics ? [
    { name: '스크립트만', value: systemMetrics.scriptsByStatus.script_ready, color: COLORS.secondary },
    { name: '비디오 준비', value: systemMetrics.scriptsByStatus.video_ready, color: COLORS.warning },
    { name: '업로드 완료', value: systemMetrics.scriptsByStatus.uploaded, color: COLORS.success },
    { name: '오류', value: systemMetrics.scriptsByStatus.error, color: COLORS.error }
  ] : []

  const pipelineData = pipelineStats?.stages.map(stage => ({
    name: stage.name,
    count: stage.count,
    percentage: stage.percentage
  })) || []

  const performanceData = systemMetrics ? [
    { name: '성공률', value: systemMetrics.performance.successRate, color: COLORS.success },
    { name: '오류율', value: systemMetrics.performance.errorRate, color: COLORS.error }
  ] : []

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStatusCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card key={index} className={`${card.bgColor} border`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                    <Icon className={`h-10 w-10 ${card.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 서비스 상태 패널 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              서비스 상태
            </CardTitle>
            <CardDescription>
              모든 시스템 구성요소의 실시간 상태 모니터링
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {serviceStatus.map((service, index) => {
                const Icon = service.icon
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'healthy': return 'text-green-600 bg-green-100'
                    case 'degraded': return 'text-yellow-600 bg-yellow-100'
                    case 'error': return 'text-red-600 bg-red-100'
                    default: return 'text-gray-600 bg-gray-100'
                  }
                }
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Icon className="h-6 w-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <Badge className={`${getStatusColor(service.status)} border-0 text-xs`}>
                        {service.status === 'healthy' ? '정상' : 
                         service.status === 'degraded' ? '저하됨' : '오류'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 상태별 분포 파이 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                스크립트 상태 분포
              </CardTitle>
              <CardDescription>전체 스크립트의 현재 상태별 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percentage }) => `${name}: ${value} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 파이프라인 처리량 바 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                파이프라인 처리량
              </CardTitle>
              <CardDescription>각 단계별 스크립트 처리 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 성능 지표 및 병목 현상 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 성능 지표 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                성능 지표
              </CardTitle>
              <CardDescription>시스템 전반적인 성능 메트릭</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{metric.name}</span>
                      <span className="font-bold text-lg" style={{ color: metric.color }}>
                        {metric.value.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metric.value} className="h-3" />
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">평균 업로드 시간</span>
                    <span className="font-bold text-lg text-blue-600">
                      {systemMetrics?.performance.avgUploadTime || 0}초
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 병목 현상 및 알림 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                시스템 알림
              </CardTitle>
              <CardDescription>병목 현상 및 주의사항</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStats?.bottlenecks.length ? (
                  pipelineStats.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">병목 감지</p>
                        <p className="text-sm text-yellow-700">{bottleneck}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">시스템 정상</p>
                      <p className="text-sm text-green-700">모든 파이프라인이 원활하게 작동 중입니다.</p>
                    </div>
                  </div>
                )}
                
                {/* 실시간 활동 */}
                {globalStats.activeUploads > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-medium text-blue-800">실시간 업로드</p>
                      <p className="text-sm text-blue-700">
                        현재 {globalStats.activeUploads}개의 업로드가 진행 중입니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              최근 활동 요약
            </CardTitle>
            <CardDescription>오늘, 이번 주, 이번 달 업로드 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {systemMetrics?.recentActivity.uploadsToday || 0}
                </div>
                <div className="text-sm text-blue-700 font-medium">오늘 업로드</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {systemMetrics?.recentActivity.uploadsThisWeek || 0}
                </div>
                <div className="text-sm text-green-700 font-medium">이번 주 업로드</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {systemMetrics?.recentActivity.uploadsThisMonth || 0}
                </div>
                <div className="text-sm text-purple-700 font-medium">이번 달 업로드</div>
              </div>
            </div>
            
            {systemMetrics?.recentActivity.lastUploadTime && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  마지막 업로드: {new Date(systemMetrics.recentActivity.lastUploadTime).toLocaleString('ko-KR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}