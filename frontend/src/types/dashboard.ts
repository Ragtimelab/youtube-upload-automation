/**
 * 대시보드 관련 타입 정의
 * 시스템 모니터링, 차트, 메트릭 관련 타입들을 중앙화
 */

import type { PerformanceMetric, ChartDataPoint, TimeSeriesData } from './common'

// 시스템 메트릭
export interface SystemMetrics {
  totalScripts: number
  scriptsByStatus: {
    script_ready: number
    video_ready: number
    uploaded: number
    error: number
    scheduled?: number
  }
  recentActivity: {
    uploadsToday: number
    uploadsThisWeek: number
    uploadsThisMonth: number
    lastUploadTime?: string
  }
  performance: {
    avgUploadTime: number
    successRate: number
    errorRate: number
    throughputPerHour: number
  }
}

// 파이프라인 통계
export interface PipelineStats {
  stages: PipelineStage[]
  bottlenecks: string[]
  throughput: {
    daily: number
    weekly: number
    monthly: number
  }
  efficiency: number
}

// 파이프라인 단계
export interface PipelineStage {
  name: string
  count: number
  percentage: number
  status: 'normal' | 'warning' | 'error'
  avgProcessingTime?: number
  errorRate?: number
}

// 서비스 상태
export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'error'
  icon: React.ComponentType
  uptime?: number
  lastCheck?: Date
  details?: Record<string, unknown>
}

// 시스템 상태 카드
export interface SystemStatusCard {
  title: string
  value: number
  icon: React.ComponentType
  colorKey: 'info' | 'warning' | 'success' | 'purple' | 'error'
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
    period: 'hour' | 'day' | 'week'
  }
}

// 차트 데이터 (common에서 가져온 것과 호환)
export interface ChartData {
  data: ChartDataPoint[]
  config?: ChartConfig
}

// 차트 구성
export interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'area' | 'donut'
  title: string
  description?: string
  data: ChartDataPoint[] | TimeSeriesData[]
  colors?: string[]
  height?: number
  width?: number
  options?: Record<string, unknown>
}

// 대시보드 위젯
export interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'metric' | 'status' | 'activity' | 'alert'
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number; w: number; h: number }
  config: ChartConfig | SystemMetrics | ServiceStatus[]
  refreshInterval?: number
  visible: boolean
}

// 대시보드 레이아웃
export interface DashboardLayout {
  id: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// 실시간 데이터 업데이트
export interface RealTimeUpdate {
  type: 'metric' | 'status' | 'alert' | 'activity'
  widgetId?: string
  data: unknown
  timestamp: Date
}

// 알람 규칙
export interface AlertRule {
  id: string
  name: string
  condition: {
    metric: string
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte'
    threshold: number
    duration?: number
  }
  severity: 'info' | 'warning' | 'error' | 'critical'
  actions: AlertAction[]
  enabled: boolean
}

// 알람 액션
export interface AlertAction {
  type: 'notification' | 'email' | 'webhook'
  config: Record<string, unknown>
  enabled: boolean
}

// 대시보드 컴포넌트 Props 타입들

export interface SystemStatusCardsProps {
  totalScripts: number
  videoReady: number
  uploaded: number
  activeUploads: number
}

export interface ServiceStatusPanelProps {
  overallStatus: string
  isWebSocketConnected: boolean
}

export interface DashboardChartsProps {
  statusDistributionData: ChartDataPoint[]
  pipelineData: PipelineStage[]
}

export interface PerformanceMetricsProps {
  performanceData: PerformanceMetric[]
  avgUploadTime: number
}

export interface SystemAlertsProps {
  bottlenecks: string[]
  activeUploads: number
}

export interface RecentActivityProps {
  recentActivity: {
    uploadsToday: number
    uploadsThisWeek: number
    uploadsThisMonth: number
    lastUploadTime?: string
  }
}

// 대시보드 데이터 훅 반환 타입
export interface DashboardData {
  // 기본 데이터
  systemMetrics: SystemMetrics | null
  pipelineStats: PipelineStats | null
  isLoading: boolean
  isRealTimeEnabled: boolean
  lastRefresh: Date
  overallStatus: string
  webSocketState: unknown
  globalStats: unknown
  
  // 처리된 데이터
  statusDistributionData: ChartDataPoint[]
  pipelineData: PipelineStage[]
  performanceData: PerformanceMetric[]
  recentActivity: RecentActivityProps['recentActivity']
  
  // 액션
  toggleRealTime: () => void
  refreshAll: () => void
}

export interface DashboardDataReturn extends DashboardData {
}

// 시스템 건강성 지표
export interface HealthMetrics {
  overall: 'healthy' | 'warning' | 'critical'
  components: {
    api: ServiceStatus
    database: ServiceStatus
    websocket: ServiceStatus
    youtube: ServiceStatus
    storage: ServiceStatus
  }
  uptime: {
    current: number
    target: number
    percentage: number
  }
  performance: {
    responseTime: number
    throughput: number
    errorRate: number
    availability: number
  }
}

// 리소스 사용률
export interface ResourceUsage {
  cpu: {
    usage: number
    cores: number
    loadAverage: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    connectionsActive: number
  }
}

// 대시보드 설정
export interface DashboardSettings {
  refreshInterval: number
  realTimeEnabled: boolean
  theme: 'light' | 'dark' | 'auto'
  timezone: string
  dateFormat: string
  numberFormat: string
  defaultLayout: string
  notifications: {
    browser: boolean
    email: boolean
    sound: boolean
  }
}

// Re-export ChartDataPoint from common for convenience
export type { ChartDataPoint } from './common'