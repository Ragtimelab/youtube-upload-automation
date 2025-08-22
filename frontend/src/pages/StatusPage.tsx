import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Wifi, 
  Server, 
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

export function StatusPage() {
  const systemStatus = [
    { name: 'Backend API', status: 'healthy', latency: '45ms', icon: Server },
    { name: 'WebSocket 연결', status: 'healthy', latency: '12ms', icon: Wifi },
    { name: 'Database', status: 'healthy', latency: '8ms', icon: Database },
    { name: 'YouTube API', status: 'warning', latency: '120ms', icon: Activity },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle2
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return AlertTriangle
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">실시간 상태</h1>
          <p className="text-gray-600 mt-1">시스템 상태와 업로드 진행 상황을 실시간으로 모니터링하세요.</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">시스템 상태</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {systemStatus.map((service, index) => {
            const StatusIcon = getStatusIcon(service.status)
            const ServiceIcon = service.icon
            return (
              <div key={index} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <ServiceIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">응답 시간: {service.latency}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                  <span className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status === 'healthy' ? '정상' 
                     : service.status === 'warning' ? '경고'
                     : '오류'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* WebSocket 연결 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">WebSocket 연결</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">연결됨</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-600">활성 연결</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">156</p>
            <p className="text-sm text-gray-600">전송된 메시지</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">98.5%</p>
            <p className="text-sm text-gray-600">가동 시간</p>
          </div>
        </div>
      </div>

      {/* 실시간 로그 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">실시간 로그</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm max-h-64 overflow-y-auto">
            <div className="space-y-1">
              <div>[2025-08-22 21:03:45] WebSocket connection established</div>
              <div>[2025-08-22 21:03:44] Backend API health check: OK</div>
              <div>[2025-08-22 21:03:43] Database connection: OK</div>
              <div>[2025-08-22 21:03:42] YouTube API quota check: 8400/10000</div>
              <div>[2025-08-22 21:03:41] System startup complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 중인 작업 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">진행 중인 작업</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>현재 진행 중인 작업이 없습니다.</p>
            <p className="text-sm mt-2">업로드나 처리 작업이 시작되면 여기에 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}