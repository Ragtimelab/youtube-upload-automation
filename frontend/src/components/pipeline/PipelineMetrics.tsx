/**
 * 파이프라인 성능 메트릭 표시 컴포넌트
 * 처리량, 효율성, 병목 현상 분석
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  AlertTriangle 
} from 'lucide-react'

interface PipelineStats {
  throughput: {
    daily: number
    weekly: number  
    monthly: number
  }
  efficiency: number
  bottlenecks: string[]
}

interface PipelineMetricsProps {
  pipelineStats: PipelineStats | null
  totalScripts: number
  activeUploads: number
}

export function PipelineMetrics({
  pipelineStats,
  totalScripts,
  activeUploads
}: PipelineMetricsProps) {
  const efficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const efficiencyBg = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-50'
    if (efficiency >= 70) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 처리량 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            처리량 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* 효율성 및 병목 현상 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            시스템 효율성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 효율성 지표 */}
            <div className={`p-4 rounded-lg ${efficiencyBg(pipelineStats?.efficiency || 0)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${efficiencyColor(pipelineStats?.efficiency || 0)}`} />
                  <span className="font-medium">전체 효율성</span>
                </div>
                <span className={`text-2xl font-bold ${efficiencyColor(pipelineStats?.efficiency || 0)}`}>
                  {pipelineStats?.efficiency || 0}%
                </span>
              </div>
            </div>

            {/* 현재 상태 요약 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{totalScripts}</div>
                <div className="text-sm text-gray-700">총 스크립트</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{activeUploads}</div>
                <div className="text-sm text-blue-700">활성 업로드</div>
              </div>
            </div>

            {/* 병목 현상 알림 */}
            {pipelineStats?.bottlenecks && pipelineStats.bottlenecks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  병목 현상
                </h4>
                <div className="space-y-1">
                  {pipelineStats.bottlenecks.map((bottleneck, index) => (
                    <Badge key={index} variant="outline" className="text-yellow-700 border-yellow-300">
                      {bottleneck}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}