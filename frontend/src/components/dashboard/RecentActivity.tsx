import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface RecentActivityData {
  uploadsToday: number
  uploadsThisWeek: number
  uploadsThisMonth: number
  lastUploadTime?: string
}

interface RecentActivityProps {
  recentActivity: RecentActivityData
}

export function RecentActivity({
  recentActivity
}: RecentActivityProps) {
  return (
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
              {recentActivity.uploadsToday}
            </div>
            <div className="text-sm text-blue-700 font-medium">오늘 업로드</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {recentActivity.uploadsThisWeek}
            </div>
            <div className="text-sm text-green-700 font-medium">이번 주 업로드</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {recentActivity.uploadsThisMonth}
            </div>
            <div className="text-sm text-purple-700 font-medium">이번 달 업로드</div>
          </div>
        </div>
        
        {recentActivity.lastUploadTime && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              마지막 업로드: {new Date(recentActivity.lastUploadTime).toLocaleString('ko-KR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}