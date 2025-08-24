import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Database, Wifi, Youtube } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: string
  icon: typeof Server
}

interface ServiceStatusPanelProps {
  overallStatus: string
  isWebSocketConnected: boolean
}

export function ServiceStatusPanel({
  overallStatus,
  isWebSocketConnected
}: ServiceStatusPanelProps) {
  const serviceStatus: ServiceStatus[] = [
    { name: 'API Server', status: overallStatus, icon: Server },
    { name: 'Database', status: 'healthy', icon: Database },
    { name: 'WebSocket', status: isWebSocketConnected ? 'healthy' : 'error', icon: Wifi },
    { name: 'YouTube API', status: 'healthy', icon: Youtube }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '정상'
      case 'degraded': return '저하됨'
      case 'error': return '오류'
      default: return '알 수 없음'
    }
  }

  return (
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
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <Icon className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <Badge className={`${getStatusColor(service.status)} border-0 text-xs`}>
                    {getStatusText(service.status)}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}