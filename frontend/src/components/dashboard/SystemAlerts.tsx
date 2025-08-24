import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react'

interface SystemAlertsProps {
  bottlenecks: string[]
  activeUploads: number
}

export function SystemAlerts({
  bottlenecks,
  activeUploads
}: SystemAlertsProps) {
  return (
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
          {bottlenecks.length > 0 ? (
            bottlenecks.map((bottleneck, index) => (
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
          {activeUploads > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5 animate-pulse" />
              <div>
                <p className="font-medium text-blue-800">실시간 업로드</p>
                <p className="text-sm text-blue-700">
                  현재 {activeUploads}개의 업로드가 진행 중입니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}