import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ThumbsUp,
  Clock,
  Calendar
} from 'lucide-react'

export function DashboardPage() {
  const stats = [
    { label: '총 조회수', value: '45.2K', change: '+12%', icon: Eye },
    { label: '구독자', value: '1.2K', change: '+8%', icon: Users },
    { label: '좋아요', value: '892', change: '+15%', icon: ThumbsUp },
    { label: '평균 시청 시간', value: '3:24', change: '+5%', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">YouTube 채널의 성과와 업로드 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">조회수 추이</h3>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              지난 30일
            </Button>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>차트 데이터 로딩 중...</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">인기 콘텐츠</h3>
            <Button variant="outline" size="sm">전체 보기</Button>
          </div>
          <div className="space-y-4">
            {[
              { title: '스마트폰 기초 사용법', views: '12.5K', duration: '15:32' },
              { title: '온라인 쇼핑 안전 가이드', views: '8.2K', duration: '12:45' },
              { title: '디지털 뱅킹 활용법', views: '6.8K', duration: '18:20' },
            ].map((video, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{video.title}</h4>
                  <p className="text-sm text-gray-600">{video.views} 조회수 • {video.duration}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>실시간 활동 로그가 여기에 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}