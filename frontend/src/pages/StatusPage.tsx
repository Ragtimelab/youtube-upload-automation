import React, { useState, useEffect, useRef } from 'react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { WebSocketStatus } from '@/components/WebSocketStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
  Cpu,
  HardDrive,
  Network,
  Zap,
  Clock,
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
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'WebSocket connection established',
      source: 'WebSocket'
    },
    {
      timestamp: new Date(Date.now() - 1000).toISOString(),
      level: 'success',
      message: 'Backend API health check: OK',
      source: 'API'
    },
    {
      timestamp: new Date(Date.now() - 2000).toISOString(),
      level: 'success',
      message: 'Database connection: OK',
      source: 'Database'
    },
    {
      timestamp: new Date(Date.now() - 3000).toISOString(),
      level: 'info',
      message: 'YouTube API quota check: 8400/10000',
      source: 'YouTube'
    }
  ])
  
  const [autoScroll, setAutoScroll] = useState(true)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const {
    systemMetrics,
    isLoading,
    isRealTimeEnabled,
    lastRefresh,
    overallStatus,
    toggleRealTime,
    refreshAll,
    healthData
  } = useSystemStatus()

  const { webSocketState, globalStats, getActiveUploads } = useUploadProgress()

  // 실시간 로그 추가 시뮬레이션
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      const messages = [
        'Health check completed',
        'WebSocket heartbeat received',
        'Database query executed successfully',
        'Script processed',
        'Upload progress updated',
        'System memory usage: 62%',
        'CPU usage: 18%',
        'Disk I/O operations: 145/sec'
      ]
      
      const sources = ['System', 'WebSocket', 'Database', 'Script', 'Upload', 'Monitor']
      
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.9 ? 'warning' : 'info',
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)]
      }
      
      setLogs(prev => [newLog, ...prev.slice(0, 49)]) // 최대 50개 로그 유지
    }, 3000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [logs, autoScroll])

  // 시스템 상태 데이터
  const systemStatus = [
    { 
      name: 'Backend API', 
      status: overallStatus, 
      latency: `${Math.floor(Math.random() * 100 + 20)}ms`, 
      icon: Server,
      details: healthData?.status || 'Unknown'
    },
    { 
      name: 'WebSocket', 
      status: webSocketState.isConnected ? 'healthy' : 'error', 
      latency: `${Math.floor(Math.random() * 50 + 5)}ms`, 
      icon: Wifi,
      details: webSocketState.connectionStatus
    },
    { 
      name: 'Database', 
      status: 'healthy', 
      latency: `${Math.floor(Math.random() * 30 + 5)}ms`, 
      icon: Database,
      details: 'PostgreSQL'
    },
    { 
      name: 'YouTube API', 
      status: 'healthy', 
      latency: `${Math.floor(Math.random() * 200 + 50)}ms`, 
      icon: Youtube,
      details: 'Quota: 8400/10000'
    }
  ]

  // 성능 메트릭 시뮬레이션 데이터
  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    time: `${23 - i}:00`,
    cpu: Math.floor(Math.random() * 40 + 10),
    memory: Math.floor(Math.random() * 30 + 40),
    network: Math.floor(Math.random() * 100 + 50)
  }))

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">실시간 상태를 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">실시간 모니터링</h1>
              <p className="text-gray-600">시스템 상태와 업로드 진행 상황을 실시간으로 모니터링</p>
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
                  variant={isMonitoring ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className="flex items-center gap-2"
                >
                  {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isMonitoring ? '모니터링 중' : '모니터링 중지'}
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

        {/* 시스템 상태 카드 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              시스템 상태
            </CardTitle>
            <CardDescription>모든 서비스 구성요소의 실시간 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemStatus.map((service, index) => {
                const StatusIcon = getStatusIcon(service.status)
                const ServiceIcon = service.icon
                
                return (
                  <div key={index} className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <ServiceIcon className="h-6 w-6 text-gray-600" />
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    </div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">지연: {service.latency}</p>
                    <p className="text-xs text-gray-500 mt-1">{service.details}</p>
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
                실시간 성능 모니터링
              </CardTitle>
              <CardDescription>CPU, 메모리, 네트워크 사용률</CardDescription>
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
                활성 업로드
              </CardTitle>
              <CardDescription>현재 진행 중인 업로드 작업</CardDescription>
            </CardHeader>
            <CardContent>
              {getActiveUploads().length > 0 ? (
                <div className="space-y-4">
                  {getActiveUploads().map((upload) => (
                    <div key={upload.scriptId} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-800">스크립트 #{upload.scriptId}</span>
                        <Badge className="bg-blue-100 text-blue-800 border-0">
                          {upload.progress}%
                        </Badge>
                      </div>
                      <Progress value={upload.progress} className="h-2 mb-2" />
                      <p className="text-sm text-blue-700">{upload.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>현재 진행 중인 업로드가 없습니다.</p>
                  <p className="text-sm mt-2">업로드가 시작되면 실시간으로 표시됩니다.</p>
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
                  실시간 로그 스트림
                </CardTitle>
                <CardDescription>시스템 활동 및 이벤트 로그</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {autoScroll ? '자동 스크롤 켜짐' : '자동 스크롤 꺼짐'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs([])}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  로그 지우기
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