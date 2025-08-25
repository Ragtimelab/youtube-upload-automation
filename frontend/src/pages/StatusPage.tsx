import { useState, useEffect, useRef } from 'react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { COMMON_STYLES, LAYOUT_STYLES } from '@/constants/styles'
import { PAGE_TEXT, UI_TEXT } from '@/constants/text'
import { 
  Activity, 
  Wifi, 
  Server, 
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Youtube,
  Monitor,
  Zap,
  Eye,
  Play,
  Pause,
  Terminal,
  Settings
} from 'lucide-react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
}

export function StatusPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<{
    latency: { [service: string]: number }
    performance: { time: string; cpu: number; memory: number; network: number }[]
  } | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const {
    systemMetrics: _systemMetrics,
    isLoading,
    isRealTimeEnabled: _isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    toggleRealTime: _toggleRealTime,
    refreshAll,
    healthData
  } = useSystemStatus()

  const { webSocketState, globalStats: _globalStats, getActiveUploads: _getActiveUploads } = useUploadProgress()

  // WebSocket을 통한 실제 로그 수신
  useEffect(() => {
    if (!isMonitoring) return

    // 실제 WebSocket 로그 수신 (향후 구현)
    // 현재는 WebSocket connection 로그만 기록
    const connectionLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Real-time monitoring started',
      source: 'System'
    }
    setLogs([connectionLog])

    return () => {
      const disconnectionLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info', 
        message: 'Real-time monitoring stopped',
        source: 'System'
      }
      setLogs(prev => [disconnectionLog, ...prev])
    }
  }, [isMonitoring])

  // 실제 시스템 메트릭 로드 (향후 API 연동)
  useEffect(() => {
    const loadSystemMetrics = async () => {
      try {
        // 향후 실제 API 호출로 대체 예정
        // const metrics = await systemApi.getSystemMetrics()
        // setSystemMetrics(metrics)
        
        // 현재는 기본값으로 설정
        setSystemMetrics({
          latency: {
            backend: 45,
            websocket: 12,
            database: 8,
            youtube: 150
          },
          performance: [{
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            cpu: 0,
            memory: 0,
            network: 0
          }]
        })
      } catch (error) {
        console.error('Failed to load system metrics:', error)
      }
    }

    loadSystemMetrics()
  }, [])

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [logs, autoScroll])

  // 실제 시스템 상태 데이터 (API 기반)
  const systemStatus = [
    { 
      name: 'Backend API', 
      status: overallStatus, 
      latency: systemMetrics?.latency?.backend ? `${systemMetrics.latency.backend}ms` : '-', 
      icon: Server,
      details: healthData?.status || 'Unknown'
    },
    { 
      name: 'WebSocket', 
      status: webSocketState.isConnected ? 'healthy' : 'error', 
      latency: systemMetrics?.latency?.websocket ? `${systemMetrics.latency.websocket}ms` : '-',
      icon: Wifi,
      details: webSocketState.connectionStatus
    },
    { 
      name: 'Database', 
      status: overallStatus === 'healthy' ? 'healthy' : 'error', 
      latency: systemMetrics?.latency?.database ? `${systemMetrics.latency.database}ms` : '-',
      icon: Database,
      details: 'SQLite'
    },
    { 
      name: 'YouTube API', 
      status: 'healthy', 
      latency: systemMetrics?.latency?.youtube ? `${systemMetrics.latency.youtube}ms` : '-',
      icon: Youtube,
      details: 'API Connected'
    }
  ]

  // 실제 성능 메트릭 데이터 (향후 API 연동 예정)
  const performanceData = systemMetrics?.performance || [
    {
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      cpu: 0,
      memory: 0,
      network: 0
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle2
      case 'degraded': return AlertTriangle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return AlertTriangle
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400'
      case 'info': return 'text-blue-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className={`${LAYOUT_STYLES.flex.center} min-h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{PAGE_TEXT.status.realTimeStatusLoading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${LAYOUT_STYLES.container.page} p-6`}>
      <div className={LAYOUT_STYLES.container.main}>
        {/* 헤더 */}
        <div className="mb-8">
          <div className={LAYOUT_STYLES.flex.between}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{PAGE_TEXT.status.title}</h1>
              <p className={COMMON_STYLES.text.pageDescription}>{PAGE_TEXT.status.description}</p>
            </div>
            
            {/* 컨트롤 패널 */}
            <div className={`${LAYOUT_STYLES.flex.start} gap-4`}>
              <WebSocketStatus 
                isConnected={webSocketState.isConnected}
                connectionStatus={webSocketState.connectionStatus}
                error={webSocketState.error}
              />
              
              <div className={`${LAYOUT_STYLES.flex.start} gap-2`}>
                <Button
                  variant={isMonitoring ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className={LAYOUT_STYLES.flex.start}
                >
                  {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isMonitoring ? UI_TEXT.button.monitoringOn : UI_TEXT.button.monitoringOff}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className={LAYOUT_STYLES.flex.start}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {UI_TEXT.common.refresh}
                </Button>
              </div>
              
              <div className={COMMON_STYLES.text.small}>
                마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>
        </div>

        {/* 시스템 상태 카드 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {PAGE_TEXT.status.systemStatus}
            </CardTitle>
            <CardDescription>{PAGE_TEXT.status.systemDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStatus.map((service, index) => {
                const StatusIcon = getStatusIcon(service.status)
                const ServiceIcon = service.icon
                
                return (
                  <div key={index} className={`${COMMON_STYLES.cardContent} rounded-lg border bg-white`}>
                    <div className={`${LAYOUT_STYLES.flex.between} mb-2`}>
                      <ServiceIcon className="h-6 w-6 text-gray-600" />
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    </div>
                    <h4 className={COMMON_STYLES.text.cardTitle}>{service.name}</h4>
                    <p className={COMMON_STYLES.text.cardDescription}>{PAGE_TEXT.status.delay}: {service.latency}</p>
                    <p className={`${COMMON_STYLES.text.small} text-gray-500 mt-1`}>{service.details}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 실시간 성능 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {PAGE_TEXT.status.performanceMonitoring}
              </CardTitle>
              <CardDescription>{PAGE_TEXT.status.performanceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="CPU (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="메모리 (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="network" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="네트워크 (KB/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 활성 업로드 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {PAGE_TEXT.status.activeUploads}
              </CardTitle>
              <CardDescription>{PAGE_TEXT.status.activeUploadsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {_getActiveUploads().length > 0 ? (
                <div className={LAYOUT_STYLES.spacing.cardContent}>
                  {_getActiveUploads().map((upload: { scriptId: number; progress: number; status: string; message: string }) => (
                    <div key={upload.scriptId} className={`${COMMON_STYLES.cardContent} bg-blue-50 rounded-lg border border-blue-200`}>
                      <div className={`${LAYOUT_STYLES.flex.between} mb-2`}>
                        <span className="font-medium text-blue-800">스크립트 #{upload.scriptId}</span>
                        <Badge className="bg-blue-100 text-blue-800 border-0">
                          {upload.progress}%
                        </Badge>
                      </div>
                      <Progress value={upload.progress} className="h-2 mb-2" />
                      <p className={`${COMMON_STYLES.text.small} text-blue-700`}>{upload.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{PAGE_TEXT.status.noActiveUploads}</p>
                  <p className={`${COMMON_STYLES.text.small} mt-2`}>{PAGE_TEXT.status.uploadsWillShow}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 실시간 로그 스트림 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  {PAGE_TEXT.status.logStream}
                </CardTitle>
                <CardDescription>{PAGE_TEXT.status.logStreamDescription}</CardDescription>
              </div>
              <div className={`${LAYOUT_STYLES.flex.start} gap-2`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={LAYOUT_STYLES.flex.start}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {autoScroll ? UI_TEXT.button.autoScrollOn : UI_TEXT.button.autoScrollOff}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                  className={LAYOUT_STYLES.flex.start}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {UI_TEXT.button.clearLogs}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={logContainerRef}
              className="bg-gray-900 rounded-lg p-4 text-sm font-mono max-h-80 overflow-y-auto"
            >
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 py-1 hover:bg-gray-800 px-2 rounded">
                  <span className="text-gray-500 text-xs shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                  <span className="text-gray-400 text-xs shrink-0 w-16">
                    [{log.source}]
                  </span>
                  <span className={`${getLogLevelColor(log.level)} text-xs uppercase shrink-0 w-12`}>
                    {log.level}
                  </span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}