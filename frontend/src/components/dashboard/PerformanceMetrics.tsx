import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target } from 'lucide-react'

interface PerformanceData {
  name: string
  value: number
  color: string
}

interface PerformanceMetricsProps {
  performanceData: PerformanceData[]
  avgUploadTime: number
}

export function PerformanceMetrics({
  performanceData,
  avgUploadTime
}: PerformanceMetricsProps) {
  return (
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
                {avgUploadTime}초
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}