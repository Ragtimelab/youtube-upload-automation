import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Upload, 
  Youtube, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const quickActions = [
    {
      title: '새 스크립트 업로드',
      description: '마크다운 스크립트 파일을 업로드하여 관리합니다.',
      icon: FileText,
      href: '/scripts',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: '비디오 업로드',
      description: '스크립트에 맞는 비디오 파일을 업로드합니다.',
      icon: Upload,
      href: '/upload',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'YouTube 게시',
      description: '완성된 콘텐츠를 YouTube에 자동으로 업로드합니다.',
      icon: Youtube,
      href: '/youtube',
      color: 'bg-red-500 hover:bg-red-600',
    },
  ]

  const recentStats = [
    { label: '전체 스크립트', value: '24', icon: FileText },
    { label: '업로드 완료', value: '18', icon: CheckCircle2 },
    { label: '처리 중', value: '3', icon: Clock },
    { label: '이번 달 조회수', value: '12.5K', icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube 업로드 자동화 시스템
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          한국 시니어 대상 콘텐츠 제작을 위한 통합 관리 시스템입니다. 
          스크립트 작성부터 YouTube 업로드까지 모든 과정을 자동화하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              to={action.href}
              className="group block bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-center space-y-4">
                <div className={`inline-flex p-4 rounded-full ${action.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {action.description}
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  시작하기
                </Button>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 실시간 상태 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">실시간 상태</h2>
          <Link to="/status">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              상세 보기
            </Button>
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>WebSocket 연결을 통한 실시간 상태 모니터링</p>
          <p className="text-sm mt-2">업로드 진행 상황과 시스템 상태를 실시간으로 확인하세요.</p>
        </div>
      </div>
    </div>
  )
}